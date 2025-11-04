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
import { supabase } from "../../supabaseClient";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function DateStatus({ darkMode }) {
  const [history, setHistory] = useState([]);
  const [expanded, setExpanded] = useState(false);
  const [editStudent, setEditStudent] = useState(null);
  const [parentRecord, setParentRecord] = useState(null);
  const [openDelete, setOpenDelete] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const theme = useTheme();

  // Fetch history from Supabase
  const fetchHistory = async () => {
    try {
      const { data, error } = await supabase
        .from("history")
        .select("*")
        .order("date", { ascending: false });
      if (error) throw error;

      const normalized = (data || []).map((rec, idx) => ({
        ...rec,
        id: String(rec.id),
        order: idx + 1,
        students: rec.students ? JSON.parse(rec.students) : [],
      }));

      setHistory(normalized);
    } catch (err) {
      console.error("Fetch error:", err);
      toast.error("History-ni olishda xatolik.");
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  // Delete record
  const handleDeleteClick = (id) => {
    setDeleteId(id);
    setOpenDelete(true);
  };
  const handleConfirmDelete = async () => {
    try {
      const { error } = await supabase
        .from("history")
        .delete()
        .eq("id", deleteId);
      if (error) throw error;
      setHistory((prev) => prev.filter((rec) => rec.id !== deleteId));
      setOpenDelete(false);
      toast.success("Davomat muvaffaqiyatli o'chirildi!");
    } catch (err) {
      console.error(err);
      toast.error("O'chirishda xatolik!");
    }
  };

  // Edit student
  const handleEditStudent = (record, student) => {
    setParentRecord(record);
    setEditStudent({ ...student });
  };

  const handleSaveStudent = async () => {
    if (!editStudent || !parentRecord) return;
    try {
      // students array ni update qilish
      const updatedStudents = parentRecord.students.map((s) =>
        s.id === editStudent.id ? editStudent : s
      );

      // Supabase update (JSON stringify qilish shart)
      const { error } = await supabase
        .from("history")
        .update({ students: JSON.stringify(updatedStudents) })
        .eq("id", parentRecord.id);

      if (error) throw error;

      // Local state update
      setHistory((prev) =>
        prev.map((rec) =>
          rec.id === parentRecord.id
            ? { ...rec, students: updatedStudents }
            : rec
        )
      );

      setEditStudent(null);
      setParentRecord(null);
      toast.success("O'quvchi muvaffaqiyatli saqlandi!");
    } catch (err) {
      console.error(err);
      toast.error("Saqlashda xatolik yuz berdi!");
    }
  };

  const handleAccordionChange = (id) => (event, isExpanded) => {
    setExpanded(isExpanded ? id : false);
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
        }}
      >
        <Typography variant="h6" fontWeight="bold" mb={2}>
          Saqlangan Davomat Tarixlari
        </Typography>

        {history.map((rec) => (
          <Accordion
            key={rec.id}
            expanded={expanded === rec.id}
            onChange={handleAccordionChange(rec.id)}
            sx={{
              mb: 2,
              bgcolor: darkMode ? theme.palette.background.paper : "#f9f9f9",
            }}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Stack
                direction="row"
                justifyContent="space-between"
                sx={{ width: "100%" }}
              >
                <Typography fontWeight="bold">
                  {rec.order}. {rec.date} — {rec.group} ({rec.day})
                </Typography>
                <Button
                  variant="outlined"
                  color="error"
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteClick(rec.id);
                  }}
                >
                  O'chirish
                </Button>
              </Stack>
            </AccordionSummary>

            <AccordionDetails>
              <div style={{ width: "100%", overflowX: "auto" }}>
                <Table size="small" sx={{ minWidth: 500 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell>T/r</TableCell>
                      <TableCell>O'quvchi ismi</TableCell>
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
                          style={{
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
        ))}

        {/* Edit Student Dialog */}
        <Dialog open={!!editStudent} onClose={() => setEditStudent(null)}>
          <DialogTitle>O'quvchini tahrirlash</DialogTitle>
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

        {/* Delete Dialog */}
        <Dialog open={openDelete} onClose={() => setOpenDelete(false)}>
          <DialogTitle>Tasdiqlash</DialogTitle>
          <DialogContent>
            Rostan ham ushbu davomatni o'chirmoqchimisiz?
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDelete(false)}>Bekor qilish</Button>
            <Button color="error" onClick={handleConfirmDelete}>
              Ha, o'chirish
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
