import React, { useEffect, useState } from "react";
import {
  Paper,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  TextField,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  useTheme,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import axios from "axios";
import { FaRegListAlt } from "react-icons/fa";

import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const HISTORY_URL =
  "https://server-supabase-3k3k.onrender.com/attendanceHistory";

export default function DateStatus({ darkMode }) {
  const [history, setHistory] = useState([]);
  const [newId, setNewId] = useState(null); // yangi qo'shilgan davomat id
  const [openDelete, setOpenDelete] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const [editStudent, setEditStudent] = useState(null);
  const [parentRecord, setParentRecord] = useState(null);
  const theme = useTheme();

  // === FETCH HISTORY ===
  const fetchHistory = async () => {
    try {
      const res = await axios.get(HISTORY_URL);
      const data = Array.isArray(res.data) ? res.data : [];
      const normalized = data
        .map((rec, idx) => ({
          ...rec,
          id: String(rec.id),
          order: idx + 1,
        }))
        .reverse(); // so'nggi qo'shilgan tepada bo'lsin
      setHistory(normalized);

      if (normalized.length > 0) {
        setNewId(normalized[0].id); // so'nggi qo'shilganni badge bilan belgilaymiz
      }
    } catch (err) {
      console.error("Fetch error:", err);
      toast.error("History-ni olishda xatolik.");
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  // === DELETE ===
  const handleDeleteClick = (id) => {
    setDeleteId(String(id));
    setOpenDelete(true);
  };

  const handleConfirmDelete = async () => {
    try {
      await axios.delete(`${HISTORY_URL}/${deleteId}`);
      setHistory((prev) => prev.filter((rec) => rec.id !== deleteId));
      setOpenDelete(false);

      if (deleteId === newId) {
        setNewId(null);
      }

      toast.success("Davomat muvaffaqiyatli o'chirildi!");
    } catch (err) {
      console.error("Delete error:", err);
      toast.error("O'chirish xatosi.");
    }
  };

  // === EDIT ===
  const handleEditStudent = (record, student) => {
    setParentRecord({ ...record, id: String(record.id) });
    setEditStudent({ ...student, id: String(student.id) });
  };

  const handleSaveStudent = async () => {
    try {
      if (!parentRecord || !editStudent) return;

      const updatedStudents = parentRecord.students.map((s) =>
        String(s.id) === String(editStudent.id) ? { ...editStudent } : s
      );
      const updatedRecord = { ...parentRecord, students: updatedStudents };
      const targetId = String(parentRecord.id);

      const res = await axios.put(`${HISTORY_URL}/${targetId}`, updatedRecord);

      setHistory((prev) =>
        prev.map((rec) => (rec.id === targetId ? res.data : rec))
      );

      setEditStudent(null);
      setParentRecord(null);
      toast.success("O'quvchi muvaffaqiyatli saqlandi!");
    } catch (err) {
      console.error("Save error:", err);
      toast.error("Saqlashda xatolik yuz berdi.");
    }
  };

  // === ACCORDION ===
  const handleAccordionChange = (id) => (event, isExpanded) => {
    setExpanded(isExpanded ? id : false);

    if (isExpanded && id === newId) {
      setNewId(null);
    }
  };

  // === CLEAR 3 MONTHS FUNCTION ===
  const handleClearOld = async () => {
    try {
      const now = new Date();
      const twoMinutesAgo = new Date(now.getTime() - 2 * 60 * 1000);

      // 2 minutdan oshgan recordlarni topish
      const oldRecords = history.filter((rec) => {
        const recDate = new Date(rec.date);
        // faqat 2 minut yoki undan katta bo‘lganlarni o‘chiramiz
        return recDate <= twoMinutesAgo;
      });

      if (oldRecords.length === 0) {
        toast.info(
          "O'chirish uchun record topilmadi (2 minut ichidagi recordlar saqlanadi)."
        );
        return;
      }

      // O'chirish
      await Promise.all(
        oldRecords.map((rec) => axios.delete(`${HISTORY_URL}/${rec.id}`))
      );

      // State-ni yangilash
      setHistory((prev) =>
        prev.filter((rec) => !oldRecords.some((old) => old.id === rec.id))
      );

      toast.success(
        `${oldRecords.length} ta davomat muvaffaqiyatli o'chirildi!`
      );
    } catch (err) {
      console.error("Clear old error:", err);
      toast.error("Davomatlarni tozalashda xatolik yuz berdi.");
    }
  };

  return (
    <>
      <Paper
        sx={{
          p: { xs: 1, sm: 3 },
          mt: 3,
          bgcolor: darkMode ? theme.palette.background.default : "#fff",
          color: darkMode ? theme.palette.text.primary : "#000",
          minHeight: "100vh",
          width: "100%",
          boxSizing: "border-box",
          transition: "all 0.3s ease",
        }}
      >
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", sm: "center" }}
          spacing={{ xs: 1, sm: 0 }}
          mb={2}
        >
          <Typography
            variant="h6"
            fontWeight="bold"
            className="flex items-center gap-2"
            sx={{
              fontSize: { xs: "0.95rem", sm: "1.25rem" },
              mb: { xs: 1, sm: 0 },
            }}
          >
            <FaRegListAlt /> Saqlangan Davomat Tarixlari
          </Typography>
          <Button
            color="error"
            variant="outlined"
            size="small"
            onClick={handleClearOld}
            sx={{
              ml: { xs: 0, sm: 2 },
              width: { xs: "100%", sm: "auto" },
            }}
          >
            3 oylikdan eski davomatlarni tozalash
          </Button>
        </Stack>
        {history.length === 0 ? (
          <Typography sx={{ opacity: 0.8 }}>
            Hozircha hech qanday davomat saqlanmagan.
          </Typography>
        ) : (
          history.map((rec) => (
            <Accordion
              key={rec.id}
              expanded={expanded === rec.id}
              onChange={handleAccordionChange(rec.id)}
              sx={{
                mb: 2,
                bgcolor: darkMode
                  ? theme.palette.background.paper
                  : "rgba(255,255,255,0.9)",
                color: darkMode ? "#fff" : "#000",
                borderRadius: 2,
                transition: "all 0.3s ease",
                width: "100%",
              }}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  sx={{ width: "100%", flexWrap: { xs: "wrap", sm: "nowrap" } }}
                >
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Typography
                      fontWeight="bold"
                      sx={{
                        fontSize: { xs: "0.9rem", sm: "1rem" },
                        mb: { xs: 1, sm: 0 },
                      }}
                    >
                      {rec.order}. {rec.date} — {rec.group} ({rec.day})
                    </Typography>

                    {newId === rec.id && (
                      <Typography
                        variant="caption"
                        sx={{
                          bgcolor: "red",
                          color: "#fff",
                          px: 1,
                          borderRadius: 1,
                          fontWeight: "bold",
                        }}
                      >
                        Yangi
                      </Typography>
                    )}
                  </Stack>

                  <Button
                    variant="outlined"
                    color="error"
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteClick(rec.id);
                    }}
                    sx={{
                      flexShrink: 0,
                      fontSize: { xs: "0.75rem", sm: "0.875rem" },
                      width: { xs: "100%", sm: "auto" },
                      whiteSpace: "nowrap",
                    }}
                  >
                    O'chirish
                  </Button>
                </Stack>
              </AccordionSummary>

              <AccordionDetails>
                <div
                  style={{
                    width: "100%",
                    overflowX: "auto",
                    borderRadius: 4,
                  }}
                >
                  <Table
                    size="small"
                    sx={{
                      minWidth: 500,
                      width: "100%",
                      whiteSpace: "nowrap",
                    }}
                  >
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ color: darkMode ? "#ddd" : "#000" }}>
                          T/r
                        </TableCell>
                        <TableCell sx={{ color: darkMode ? "#ddd" : "#000" }}>
                          O'quvchi ismi
                        </TableCell>
                        <TableCell sx={{ color: darkMode ? "#ddd" : "#000" }}>
                          Guruh
                        </TableCell>
                        <TableCell sx={{ color: darkMode ? "#ddd" : "#000" }}>
                          Holati
                        </TableCell>
                        <TableCell sx={{ color: darkMode ? "#ddd" : "#000" }}>
                          Tahrir
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {rec.students.map((s, i) => (
                        <TableRow key={s.id ?? i}>
                          <TableCell>{i + 1}</TableCell>
                          <TableCell>{s.fullName}</TableCell>
                          <TableCell>{s.group || "-"}</TableCell>
                          <TableCell>
                            <b
                              style={{
                                color:
                                  s.status === "keldi"
                                    ? "limegreen"
                                    : s.status === "kelmadi"
                                    ? "salmon"
                                    : s.status === "kechikdi"
                                    ? "orange"
                                    : darkMode
                                    ? "#aaa"
                                    : "gray",
                              }}
                            >
                              {s.status || "belgilanmagan"}
                              {s.late && s.late !== ""
                                ? ` (${s.late} daqiqa kech)`
                                : ""}
                            </b>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="outlined"
                              size="small"
                              onClick={() => handleEditStudent(rec, s)}
                              sx={{
                                fontSize: { xs: "0.7rem", sm: "0.875rem" },
                                width: { xs: "100%", sm: "auto" },
                              }}
                            >
                              Tahrirlash
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </AccordionDetails>
            </Accordion>
          ))
        )}

        {/* === EDIT DIALOG === */}
        <Dialog
          open={!!editStudent}
          onClose={() => setEditStudent(null)}
          PaperProps={{
            sx: {
              bgcolor: darkMode ? theme.palette.background.paper : "#fff",
              color: darkMode ? "#fff" : "#000",
            },
          }}
        >
          <DialogTitle>O'quvchini tahrirlash</DialogTitle>
          {editStudent && (
            <DialogContent
              sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}
            >
              <Typography fontWeight="bold">
                {editStudent.fullName} ({editStudent.group || "Guruhsiz"})
              </Typography>
              <TextField
                select
                label="Holat"
                value={editStudent.status || ""}
                onChange={(e) =>
                  setEditStudent({
                    ...editStudent,
                    status: e.target.value,
                    late: e.target.value === "kechikdi" ? editStudent.late : "",
                  })
                }
                SelectProps={{ native: true }}
                fullWidth
              >
                <option value="">Tanlanmagan</option>
                <option value="keldi">Keldi</option>
                <option value="kelmadi">Kelmadi</option>
                <option value="kechikdi">Kechikdi</option>
              </TextField>
              {editStudent.status === "kechikdi" && (
                <TextField
                  label="Necha daqiqa kechikdi?"
                  type="number"
                  value={editStudent.late || ""}
                  onChange={(e) =>
                    setEditStudent({ ...editStudent, late: e.target.value })
                  }
                  fullWidth
                />
              )}
            </DialogContent>
          )}
          <DialogActions>
            <Button onClick={() => setEditStudent(null)}>Bekor qilish</Button>
            <Button
              onClick={handleSaveStudent}
              color="success"
              variant="contained"
            >
              Saqlash
            </Button>
          </DialogActions>
        </Dialog>

        {/* === DELETE DIALOG === */}
        <Dialog
          open={openDelete}
          onClose={() => setOpenDelete(false)}
          PaperProps={{
            sx: {
              bgcolor: darkMode ? theme.palette.background.paper : "#fff",
              color: darkMode ? "#fff" : "#000",
            },
          }}
        >
          <DialogTitle>Tasdiqlash</DialogTitle>
          <DialogContent>
            Rostan ham ushbu davomatni o'chirmoqchimisiz?
          </DialogContent>
          <DialogActions sx={{ flexWrap: { xs: "wrap", sm: "nowrap" } }}>
            <Button
              onClick={() => setOpenDelete(false)}
              sx={{ width: { xs: "100%", sm: "auto" } }}
            >
              Bekor qilish
            </Button>
            <Button
              color="error"
              onClick={handleConfirmDelete}
              sx={{ width: { xs: "100%", sm: "auto" } }}
            >
              Ha, o'chirish
            </Button>
          </DialogActions>
        </Dialog>
      </Paper>

      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme={darkMode ? "dark" : "light"}
      />
    </>
  );
}
