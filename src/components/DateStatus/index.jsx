// src/DateStatus.jsx
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
  DialogContentText,
  DialogActions,
  Stack,
} from "@mui/material";
import axios from "axios";

const HISTORY_URL = "http://localhost:3001/attendanceHistory";

export default function DateStatus() {
  const [history, setHistory] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [deleteId, setDeleteId] = useState(null); // 🔹 serverdagi id saqlanadi

  // 🔹 Ma’lumotlarni olish va tartib raqam qo'shish
  const fetchHistory = async () => {
    try {
      const res = await axios.get(HISTORY_URL);

      // Tartib raqamni avtomatik qo‘shish (UI uchun)
      const sorted = res.data
        .sort((a, b) => a.id - b.id) // eski yozuvlar pastda
        .map((rec, idx) => ({ ...rec, order: idx + 1 }));

      setHistory(sorted.reverse()); // so‘nggi yozuv yuqorida bo‘lsin
    } catch (err) {
      console.error("Ma'lumot olishda xatolik:", err);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  // 🔹 O'chirish tugmasi bosilganda dialogni ochamiz
  const handleDeleteClick = (id) => {
    setDeleteId(id);
    setOpenDialog(true);
  };

  // 🔹 Ha tugmasi bosilganda DB dan o'chiramiz va state update qilamiz
  const handleConfirmDelete = async () => {
    try {
      if (!deleteId) return;

      await axios.delete(`${HISTORY_URL}/${deleteId}`); // serverdagi id orqali o'chirish

      // Front-endda state ni update qilish va tartib raqamlarni qayta o‘rnatish
      setHistory((prev) =>
        prev
          .filter((rec) => rec.id !== deleteId)
          .map((rec, idx) => ({ ...rec, order: idx + 1 }))
          .reverse()
      );

      setOpenDialog(false);
      setDeleteId(null);
    } catch (err) {
      console.error("O'chirishda xatolik:", err);
      setOpenDialog(false);
    }
  };

  return (
    <Paper sx={{ p: 3, mt: 3 }}>
      <Typography variant="h6" mb={2} fontWeight="bold">
        📅 Saqlangan Davomat Tarixlari
      </Typography>

      {history.length === 0 ? (
        <Typography>Hozircha hech qanday davomat saqlanmagan.</Typography>
      ) : (
        history.map((rec) => (
          <Paper key={rec.id} sx={{ p: 2, mb: 3 }} elevation={3}>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
            >
              <Typography variant="subtitle1" fontWeight="bold" mb={1}>
                {rec.order}. {rec.date} — {rec.day} ({rec.time})
              </Typography>
              <Button
                variant="outlined"
                color="error"
                onClick={() => handleDeleteClick(rec.id)}
              >
                O'chirish
              </Button>
            </Stack>

            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>T/r</TableCell>
                  <TableCell>O‘quvchi ismi</TableCell>
                  <TableCell>Guruh</TableCell>
                  <TableCell>Holati</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {rec.students.map((s, i) => (
                  <TableRow key={i}>
                    <TableCell>{i + 1}</TableCell>
                    <TableCell>{s.fullName}</TableCell>
                    <TableCell>{s.group || "-"}</TableCell>
                    <TableCell>
                      <b
                        style={{
                          color:
                            s.status === "keldi"
                              ? "green"
                              : s.status === "kelmadi"
                              ? "red"
                              : "gray",
                        }}
                      >
                        {s.status || "belgilanmagan"}
                      </b>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
        ))
      )}

      {/* 🔹 Tasdiqlash modal */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>⚠️ Tasdiqlash</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Rostan ham ushbu davomatni o‘chrimoqchimisiz?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Bekor qilish</Button>
          <Button color="error" onClick={handleConfirmDelete}>
            Ha, o‘chirish
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}
