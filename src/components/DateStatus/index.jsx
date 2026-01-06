// src/components/DateStatus.jsx
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
  Chip,
  CircularProgress,
  useTheme,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { db } from "../firebase";
import { 
  collection, 
  getDocs, 
  deleteDoc, 
  doc, 
  updateDoc 
} from "firebase/firestore";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function DateStatus({ darkMode }) {
  const [history, setHistory] = useState([]);
  const [expanded, setExpanded] = useState(false);
  const [editStudent, setEditStudent] = useState(null);
  const [parentRecord, setParentRecord] = useState(null);
  const [openDelete, setOpenDelete] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [loading, setLoading] = useState(true);
  const theme = useTheme();

  // 🟢 History-ni olish
  const fetchHistory = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, "history"));
      const data = querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));

      // Sana bo'yicha kamayish tartibida saralash (eng yangisi tepada)
      data.sort((a, b) => new Date(b.date) - new Date(a.date));

      const normalized = data.map((rec, idx) => ({
        ...rec,
        order: idx + 1,
        // Firebasega JSON string qilib saqlagandik, uni parse qilamiz
        students: typeof rec.students === 'string' ? JSON.parse(rec.students) : rec.students,
      }));

      setHistory(normalized);
    } catch (err) {
      console.error("Fetch error:", err);
      toast.error("History-ni olishda xatolik!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleAccordionChange = (id) => (event, isExpanded) => {
    setExpanded(isExpanded ? id : false);
  };

  // O‘chirish
  const handleDeleteClick = (id) => {
    setDeleteId(id);
    setOpenDelete(true);
  };

  const handleConfirmDelete = async () => {
    try {
      await deleteDoc(doc(db, "history", deleteId));
      setHistory((prev) => prev.filter((rec) => rec.id !== deleteId));
      setOpenDelete(false);
      toast.success("Davomat muvaffaqiyatli o‘chirildi!");
    } catch (err) {
      console.error(err);
      toast.error("O‘chirishda xatolik!");
    }
  };

  // Tahrirlash
  const handleEditStudent = (record, student) => {
    setParentRecord(record);
    setEditStudent({ ...student });
  };

  const handleSaveStudent = async () => {
    if (!editStudent || !parentRecord) return;

    try {
      const updatedStudents = parentRecord.students.map((s) =>
        s.id === editStudent.id ? editStudent : s
      );

      const recordDoc = doc(db, "history", parentRecord.id);
      await updateDoc(recordDoc, { students: JSON.stringify(updatedStudents) });

      setHistory((prev) =>
        prev.map((rec) =>
          rec.id === parentRecord.id
            ? { ...rec, students: updatedStudents }
            : rec
        )
      );

      setEditStudent(null);
      setParentRecord(null);
      toast.success("O‘quvchi holati yangilandi!");
    } catch (err) {
      console.error(err);
      toast.error("Saqlashda xatolik!");
    }
  };

  return (
    <>
      <Paper
        sx={{
          p: 3,
          mt: 3,
          bgcolor: darkMode ? theme.palette.background.default : "#fff",
          color: darkMode ? theme.palette.text.primary : "#000",
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <Typography variant="h6" fontWeight="bold" mb={2}>
          Saqlangan Davomat Tarixlari
        </Typography>

        {loading ? (
          <Stack
            direction="column"
            alignItems="center"
            justifyContent="center"
            sx={{ mt: 10 }}
          >
            <CircularProgress />
            <Typography sx={{ mt: 2 }}>Yuklanmoqda...</Typography>
          </Stack>
        ) : history.length === 0 ? (
          <Stack
            direction="column"
            alignItems="center"
            justifyContent="center"
            sx={{ mt: 10 }}
          >
            <Typography variant="body1" color="textSecondary" align="center">
              Davomat hali saqlanmagan
            </Typography>
          </Stack>
        ) : (
          history.map((rec) => (
            <Accordion
              key={rec.id}
              expanded={expanded === rec.id}
              onChange={handleAccordionChange(rec.id)}
              sx={{
                width: "100%",
                mb: 2,
                bgcolor: darkMode ? theme.palette.background.paper : "#f9f9f9",
                border: "1px solid #ddd",
              }}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  sx={{ width: "100%" }}
                >
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography fontWeight="bold">
                      {rec.order}. {rec.date} — {rec.group} ({rec.day})
                    </Typography>
                  </Stack>

                  <Button
                    variant="outlined"
                    color="error"
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteClick(rec.id);
                    }}
                  >
                    O‘chirish
                  </Button>
                </Stack>
              </AccordionSummary>

              <AccordionDetails>
                <div style={{ width: "100%", overflowX: "auto" }}>
                  <Table size="small" sx={{ minWidth: 500 }}>
                    <TableHead>
                      <TableRow>
                        <TableCell>T/r</TableCell>
                        <TableCell>O‘quvchi ismi</TableCell>
                        <TableCell>Guruh</TableCell>
                        <TableCell>Holati</TableCell>
                        <TableCell>Tahrir</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {rec.students.map((s, i) => (
                        <TableRow key={s.id || i}>
                          <TableCell>{i + 1}</TableCell>
                          <TableCell>{s.fullName}</TableCell>
                          <TableCell>{s.group || "-"}</TableCell>
                          <TableCell
                            sx={{
                              color:
                                s.status === "keldi"
                                  ? "limegreen"
                                  : s.status === "kelmadi"
                                  ? "salmon"
                                  : s.status === "kechikdi"
                                  ? "orange"
                                  : "gray",
                            }}
                          >
                            {s.status || "belgilanmagan"}{" "}
                            {s.late ? `(${s.late} daqiqa kech)` : ""}
                          </TableCell>
                          <TableCell>
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => handleEditStudent(rec, s)}
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

        <Dialog open={!!editStudent} onClose={() => setEditStudent(null)}>
          <DialogTitle>O‘quvchini tahrirlash</DialogTitle>
          {editStudent && (
            <DialogContent
              sx={{ display: "flex", flexDirection: "column", gap: 2 }}
            >
              <Typography fontWeight="bold">
                {editStudent.fullName} ({editStudent.group || "-"})
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
              >
                <option value="">Tanlanmagan</option>
                <option value="keldi">Keldi</option>
                <option value="kelmadi">Kelmadi</option>
                <option value="kechikdi">Kechikdi</option>
              </TextField>
              {editStudent.status === "kechikdi" && (
                <TextField
                  type="number"
                  label="Necha daqiqa kechikdi?"
                  value={editStudent.late || ""}
                  onChange={(e) =>
                    setEditStudent({ ...editStudent, late: e.target.value })
                  }
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

        <Dialog open={openDelete} onClose={() => setOpenDelete(false)}>
          <DialogTitle>Tasdiqlash</DialogTitle>
          <DialogContent>
            Rostan ham ushbu davomatni o‘chirmoqchimisiz?
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDelete(false)}>Bekor qilish</Button>
            <Button color="error" onClick={handleConfirmDelete}>
              Ha, o‘chirish
            </Button>
          </DialogActions>
        </Dialog>
      </Paper>

      <ToastContainer
        position="top-right"
        autoClose={2500}
        theme={darkMode ? "dark" : "light"}
      />
    </>
  );
}