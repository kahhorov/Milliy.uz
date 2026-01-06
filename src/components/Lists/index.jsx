// src/components/Lists.jsx
import React, { useState, useEffect, useMemo } from "react";
import {
  Paper,
  Stack,
  TextField,
  IconButton,
  Typography,
  Checkbox,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  FormControlLabel,
  Button,
} from "@mui/material";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import { Edit, Delete } from "@mui/icons-material";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { db } from "../firebase";
import { 
  collection, 
  addDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  doc 
} from "firebase/firestore";

function Lists() {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState({
    fullName: "",
    phoneNumber: "",
    group: "",
    weekDays: [],
  });
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const [showCheckedOnly, setShowCheckedOnly] = useState(false);
  const [pageSize, setPageSize] = useState(10);

  const days = [
    "Dushanba",
    "Seshanba",
    "Chorshanba",
    "Payshanba",
    "Juma",
    "Shanba",
    "Yakshanba",
  ];

  const listsCollectionRef = collection(db, "lists");

  // --- Ma'lumotlarni Firebase'dan olish ---
  const getData = async () => {
    try {
      const data = await getDocs(listsCollectionRef);
      const savedChecks = JSON.parse(localStorage.getItem("checkedRows") || "{}");

      const merged = data.docs.map((doc) => {
        const r = doc.data();
        return {
          ...r,
          id: doc.id, // Firestore ID
          checked: savedChecks[doc.id] || false,
        };
      });

      // ID bo'yicha saralash (ixtiyoriy, Firestore tartibsiz qaytarishi mumkin)
      setRows(merged);
    } catch (error) {
      console.error(error);
      toast.error("Ma'lumotlarni olishda xatolik!");
    }
  };

  useEffect(() => {
    getData();
  }, []);

  const updateLocalChecks = (updatedRows) => {
    const checks = {};
    updatedRows.forEach((r) => (checks[r.id] = r.checked));
    localStorage.setItem("checkedRows", JSON.stringify(checks));
  };

  // --- Input o'zgarishi ---
  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "weekDays") {
      const arr = Array.isArray(value) ? value : value.split(",");
      setForm((prev) => ({ ...prev, weekDays: arr }));
      return;
    }

    if (name === "fullName") {
      const formatted = value
        .split(" ")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(" ");
      setForm((prev) => ({ ...prev, fullName: formatted }));
      return;
    }

    if (name === "group") {
      const formattedGroup =
        value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
      // Guruh bo'yicha oldingi sozlamalarni qidirish (logic UI uchun)
      const lastInGroup = rows
        .filter((r) => r.group === formattedGroup)
        .pop(); // eng oxirgisini olamiz
      
      const weekDaysArray = lastInGroup ? lastInGroup.weekDays : [];
      setForm((prev) => ({
        ...prev,
        group: formattedGroup,
        weekDays: weekDaysArray,
      }));
      return;
    }

    if (name === "phoneNumber") {
      let digits = value.replace(/\D/g, "");
      if (!digits.startsWith("998")) digits = "998" + digits;
      if (digits.length > 12) digits = digits.slice(0, 12);
      let formatted = "+998)";
      if (digits.length > 3) formatted += " " + digits.slice(3, 5);
      if (digits.length > 5) formatted += " " + digits.slice(5, 8);
      if (digits.length > 8) formatted += "-" + digits.slice(8, 10);
      if (digits.length > 10) formatted += "-" + digits.slice(10, 12);
      setForm((prev) => ({ ...prev, phoneNumber: formatted }));
      return;
    }

    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // --- Qo'shish / Tahrirlash ---
  const handleAdd = async () => {
    if (
      !form.fullName ||
      !form.phoneNumber ||
      !form.group ||
      !form.weekDays.length
    ) {
      toast.error("Barcha maydonlarni to'ldiring!");
      return;
    }

    try {
      if (editingId) {
        const userDoc = doc(db, "lists", editingId);
        await updateDoc(userDoc, form);
        toast.success("Ma'lumot tahrirlandi!");
        setEditingId(null);
      } else {
        await addDoc(listsCollectionRef, form);
        toast.success("Ma'lumot qo'shildi!");
      }

      setForm({ fullName: "", phoneNumber: "", group: "", weekDays: [] });
      getData();
    } catch (error) {
      console.error(error);
      toast.error("Xatolik yuz berdi!");
    }
  };

  const toggleCheck = (id) => {
    const updated = rows.map((r) =>
      r.id === id ? { ...r, checked: !r.checked } : r
    );
    setRows(updated);
    updateLocalChecks(updated);
  };

  const handleEdit = (row) => {
    setForm({
      fullName: row.fullName,
      phoneNumber: row.phoneNumber,
      group: row.group,
      weekDays: row.weekDays || [],
    });
    setEditingId(row.id);
  };

  const handleDelete = async (id) => {
    if(!window.confirm("Rostdan ham o'chirmoqchimisiz?")) return;
    try {
      const userDoc = doc(db, "lists", id);
      await deleteDoc(userDoc);
      toast.info("Ma'lumot o'chirildi!");
      getData();
    } catch (error) {
      console.error(error);
      toast.error("O'chirishda xatolik!");
    }
  };

  const filteredRows = useMemo(() => {
    let filtered = rows;
    if (search.trim()) {
      filtered = filtered.filter(
        (r) =>
          r.fullName?.toLowerCase().includes(search.toLowerCase()) ||
          r.phoneNumber?.toLowerCase().includes(search.toLowerCase()) ||
          r.group?.toLowerCase().includes(search.toLowerCase())
      );
    }
    if (showCheckedOnly) filtered = filtered.filter((r) => r.checked);
    return filtered.map((r, i) => ({ ...r, order: i + 1 }));
  }, [rows, search, showCheckedOnly]);

  const columns = [
    {
      field: "checked",
      headerName: "",
      width: 60,
      renderCell: (params) => (
        <Checkbox
          checked={!!params.row.checked}
          onChange={() => toggleCheck(params.row.id)}
        />
      ),
    },
    { field: "order", headerName: "№", width: 70 },
    { field: "fullName", headerName: "Ism Familiya", flex: 1 },
    { field: "phoneNumber", headerName: "Telefon", flex: 1 },
    { field: "group", headerName: "Guruh", flex: 1 },
    {
      field: "weekDays",
      headerName: "Hafta kunlari",
      flex: 1,
      renderCell: (params) =>
        Array.isArray(params.row.weekDays)
          ? params.row.weekDays.join(", ")
          : params.row.weekDays,
    },
    {
      field: "actions",
      headerName: "Amallar",
      width: 160,
      renderCell: (params) =>
        params.row.checked && (
          <Stack direction="row" spacing={1}>
            <IconButton color="primary" onClick={() => handleEdit(params.row)}>
              <Edit />
            </IconButton>
            <IconButton
              color="error"
              onClick={() => handleDelete(params.row.id)}
            >
              <Delete />
            </IconButton>
          </Stack>
        ),
    },
  ];

  return (
    <Paper sx={{ p: 2, minHeight: "100vh" }}>
      <ToastContainer />
      <Typography variant="h5" textAlign="start" mb={2}>
        O'quvchilar ro'yxati
      </Typography>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} mb={2}>
        <TextField
          label="Qidirish"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          fullWidth
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={showCheckedOnly}
              onChange={(e) => setShowCheckedOnly(e.target.checked)}
            />
          }
          label="Tanlanganlar"
        />
      </Stack>
      <Stack spacing={2} mb={3}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
          <TextField
            label="Ism Familiya"
            name="fullName"
            value={form.fullName}
            onChange={handleChange}
            fullWidth
          />
          <TextField
            label="Telefon"
            name="phoneNumber"
            value={form.phoneNumber}
            onChange={handleChange}
            fullWidth
          />
          <TextField
            label="Guruh"
            name="group"
            value={form.group}
            onChange={handleChange}
            fullWidth
          />
        </Stack>

        <FormControl fullWidth>
          <InputLabel>Hafta kunlarini tanlang</InputLabel>
          <Select
            multiple
            name="weekDays"
            value={Array.isArray(form.weekDays) ? form.weekDays : []}
            onChange={handleChange}
            renderValue={(selected) =>
              Array.isArray(selected) ? selected.join(", ") : ""
            }
          >
            {days.map((day) => (
              <MenuItem key={day} value={day}>
                <Checkbox
                  checked={
                    Array.isArray(form.weekDays)
                      ? form.weekDays.includes(day)
                      : false
                  }
                />
                {day}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Button
          variant="contained"
          color={editingId ? "secondary" : "primary"}
          onClick={handleAdd}
          sx={{ width: "100px" }}
        >
          {editingId ? "O'zgartirish" : "Qo'shish"}
        </Button>
      </Stack>
      <DataGrid
        rows={filteredRows}
        columns={columns}
        pageSize={pageSize}
        onPageSizeChange={(n) => setPageSize(n)}
        pageSizeOptions={[10, 20, 50]}
        disableRowSelectionOnClick
        slots={{ toolbar: GridToolbar }}
      />
    </Paper>
  );
}

export default Lists;