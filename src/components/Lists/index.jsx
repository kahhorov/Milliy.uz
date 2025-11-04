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
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../supabaseClient";

function Lists() {
  const { user } = useAuth();
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

  // --- Ma'lumotlarni Supabase'dan olish ---
  const getData = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("lists")
      .select("*")
      .eq("user_id", user.id)
      .order("id", { ascending: true });

    if (error) {
      console.error(error);
      toast.error("Ma'lumotlarni olishda xatolik!");
      return;
    }

    const savedChecks = JSON.parse(localStorage.getItem("checkedRows") || "{}");

    const merged = data.map((r) => {
      let weekDaysArray = [];
      if (r.weekDays) {
        try {
          weekDaysArray = JSON.parse(r.weekDays); // JSON string -> Array
        } catch (e) {
          weekDaysArray = Array.isArray(r.weekDays)
            ? r.weekDays
            : r.weekDays.split(",").map((d) => d.trim());
        }
      }
      return {
        ...r,
        checked: savedChecks[r.id] || false,
        weekDays: weekDaysArray,
      };
    });

    setRows(merged);
  };

  useEffect(() => {
    getData();
  }, [user]);

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
      const lastInGroup = rows
        .filter((r) => r.group === formattedGroup)
        .sort((a, b) => b.id - a.id)[0];
      const weekDaysArray = lastInGroup
        ? Array.isArray(lastInGroup.weekDays)
          ? lastInGroup.weekDays
          : lastInGroup.weekDays.split(",").map((d) => d.trim())
        : [];
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
      const weekDaysString = JSON.stringify(form.weekDays); // Array -> JSON string

      if (editingId) {
        const { error } = await supabase
          .from("lists")
          .update({ ...form, weekDays: weekDaysString })
          .eq("id", editingId);
        if (error) throw error;
        toast.success("Ma'lumot tahrirlandi!");
        setEditingId(null);
      } else {
        const { error } = await supabase
          .from("lists")
          .insert([{ ...form, user_id: user.id, weekDays: weekDaysString }]);
        if (error) throw error;
        toast.success("Ma'lumot qo'shildi!");
      }

      setForm({ fullName: "", phoneNumber: "", group: "", weekDays: [] });
      await getData();
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
    let weekDaysArray = [];
    if (row.weekDays) {
      try {
        weekDaysArray = JSON.parse(row.weekDays);
      } catch (e) {
        weekDaysArray = Array.isArray(row.weekDays)
          ? row.weekDays
          : row.weekDays.split(",").map((d) => d.trim());
      }
    }

    setForm({
      fullName: row.fullName,
      phoneNumber: row.phoneNumber,
      group: row.group,
      weekDays: weekDaysArray,
    });
    setEditingId(row.id);
  };

  const handleDelete = async (id) => {
    try {
      const { error } = await supabase.from("lists").delete().eq("id", id);
      if (error) throw error;
      toast.info("Ma'lumot o'chirildi!");
      await getData();
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
    <Paper sx={{ p: 3, minHeight: "100vh" }}>
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
