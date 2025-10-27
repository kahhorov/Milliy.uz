import React, { useState, useMemo, useEffect } from "react";
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
  useTheme,
  Button,
} from "@mui/material";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import { Edit, Delete } from "@mui/icons-material";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const API_URL = "https://server-supabase-3k3k.onrender.com/users";

function Lists({ darkMode }) {
  const theme = useTheme();

  const [rows, setRows] = useState([]);
  const [form, setForm] = useState({
    fullName: "",
    phoneNumber: "",
    group: "",
    weekDays: [],
  });
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [showCheckedOnly, setShowCheckedOnly] = useState(false);
  const [groupDays, setGroupDays] = useState({});

  const days = [
    "Dushanba",
    "Seshanba",
    "Chorshanba",
    "Payshanba",
    "Juma",
    "Shanba",
    "Yakshanba",
  ];

  // Ma'lumot olish
  const getData = async () => {
    try {
      const res = await axios.get(API_URL);
      const sorted = res.data.sort((a, b) => a.order - b.order);
      setRows(sorted);

      const savedDays = {};
      sorted.forEach((r) => {
        if (r.group && r.weekDays?.length) savedDays[r.group] = r.weekDays;
      });
      setGroupDays(savedDays);
    } catch (error) {
      toast.error("Ma'lumotlarni olishda xatolik yuz berdi.", {
        position: "top-right",
      });
    }
  };

  useEffect(() => {
    getData();
  }, []);

  // Form inputlarini formatlash
  const formatName = (name) =>
    name
      .split(" ")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(" ");

  const formatGroup = (group) => {
    if (!group) return "";
    return group.charAt(0).toUpperCase() + group.slice(1).toLowerCase();
  };

  const handleChange = (e) => {
    let value = e.target.value;
    const name = e.target.name;

    if (name === "fullName") value = formatName(value);
    if (name === "group") {
      value = formatGroup(value);
      // Guruhga mos hafta kunlarini avtomatik to'ldirish
      if (groupDays[value]) {
        setForm((prev) => ({
          ...prev,
          [name]: value,
          weekDays: groupDays[value],
        }));
        return;
      } else {
        setForm((prev) => ({ ...prev, [name]: value, weekDays: [] }));
        return;
      }
    }

    if (name === "weekDays") {
      setForm((prev) => ({
        ...prev,
        [name]: typeof value === "string" ? value.split(",") : value,
      }));
      return;
    }

    setForm({ ...form, [name]: value });
  };

  // Qo'shish yoki tahrirlash
  const handleAdd = async () => {
    if (
      !form.fullName ||
      !form.phoneNumber ||
      !form.group ||
      form.weekDays.length === 0
    ) {
      toast.error("Iltimos, barcha maydonlarni to'ldiring!", {
        position: "top-right",
      });
      return;
    }

    try {
      if (editingId) {
        await axios.patch(`${API_URL}/${editingId}`, form);
        toast.success("Ma'lumot muvaffaqiyatli tahrirlandi!", {
          position: "top-right",
        });
        setEditingId(null);
      } else {
        const newOrder = rows.length + 1;
        const newUser = { order: newOrder, ...form, checked: false };
        await axios.post(API_URL, newUser);

        setGroupDays((prev) => ({
          ...prev,
          [form.group]: form.weekDays,
        }));

        toast.success("O'quvchi muvaffaqiyatli qo'shildi!", {
          position: "top-right",
        });
      }

      await getData();
      setForm({
        fullName: "",
        phoneNumber: "",
        group: "",
        weekDays: [],
      });
    } catch (error) {
      toast.error("Xatolik yuz berdi. Iltimos, qaytadan urinib ko'ring.", {
        position: "top-right",
      });
    }
  };

  const toggleCheck = async (id) => {
    const user = rows.find((r) => r.id === id);
    if (!user) return;
    try {
      await axios.patch(`${API_URL}/${id}`, { checked: !user.checked });
      setRows((prev) =>
        prev.map((r) => (r.id === id ? { ...r, checked: !r.checked } : r))
      );
    } catch (error) {
      toast.error("Checkbox yangilanishida xatolik.", {
        position: "top-right",
      });
    }
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
    const user = rows.find((r) => r.id === id);
    if (!user) return;

    try {
      await axios.delete(`${API_URL}/${id}`);
      toast.info(`O'quvchi o'chirildi: ${user.fullName}`, {
        position: "top-right",
        autoClose: 2000,
      });
      await getData();
    } catch (error) {
      toast.error("O'chirishda xatolik yuz berdi.", { position: "top-right" });
    }
  };

  const filteredRows = useMemo(() => {
    let filtered = rows;
    if (search.trim()) {
      filtered = filtered.filter(
        (r) =>
          r.fullName.toLowerCase().includes(search.toLowerCase()) ||
          r.phoneNumber.toLowerCase().includes(search.toLowerCase()) ||
          r.group.toLowerCase().includes(search.toLowerCase())
      );
    }
    if (showCheckedOnly) {
      filtered = filtered.filter((r) => r.checked);
    }
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
    { field: "phoneNumber", headerName: "Telefon raqam", flex: 1 },
    { field: "group", headerName: "Guruh", width: 150 },
    {
      field: "weekDays",
      headerName: "Hafta kunlari",
      flex: 1,
      renderCell: (params) => params.row.weekDays?.join(", ") || "-",
    },
    {
      field: "actions",
      headerName: "Amallar",
      width: 160,
      renderCell: (params) =>
        params.row.checked && (
          <Stack direction="row" spacing={1}>
            <IconButton
              color="primary"
              onClick={() => handleEdit(params.row)}
              title="Tahrirlash"
            >
              <Edit />
            </IconButton>
            <IconButton
              color="error"
              onClick={() => handleDelete(params.row.id)}
              title="O'chirish"
            >
              <Delete />
            </IconButton>
          </Stack>
        ),
    },
  ];

  const localeText = {
    toolbarColumns: "Ustunlar",
    toolbarFilters: "Filtrlar",
    toolbarDensity: "Ko'rinish",
    toolbarExport: "Yuklab olish",
    noRowsLabel: "Ma'lumot topilmadi",
    noResultsOverlayLabel: "Mos keluvchi natija yo'q",
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 0, md: 3 },
        width: "100%",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        gap: 2,
        bgcolor: theme.palette.background.default,
        color: theme.palette.text.primary,
        transition: "all 0.3s ease",
      }}
    >
      <ToastContainer />
      <Typography
        variant="h5"
        fontWeight="bold"
        sx={{ textAlign: "center", mb: 1 }}
      >
        O'quvchilar ro'yxati
      </Typography>

      {/* Qidirish va filtr */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        alignItems="center"
        sx={{ width: "100%" }}
      >
        <TextField
          label="Ism, telefon yoki guruh orqali qidirish"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          fullWidth
          variant="outlined"
          sx={{
            bgcolor: theme.palette.background.paper,
            borderRadius: 1,
          }}
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

      {/* Forma */}
      <Stack direction="column" spacing={2} sx={{ width: "100%" }}>
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          sx={{ width: "100%" }}
        >
          <TextField
            label="Ism Familiya"
            name="fullName"
            value={form.fullName}
            onChange={handleChange}
            fullWidth
            sx={{ bgcolor: theme.palette.background.paper }}
          />
          <TextField
            label="Telefon raqam"
            name="phoneNumber"
            value={form.phoneNumber}
            onChange={handleChange}
            fullWidth
            sx={{ bgcolor: theme.palette.background.paper }}
          />
          <TextField
            label="Guruh"
            name="group"
            value={form.group}
            onChange={handleChange}
            fullWidth
            sx={{ bgcolor: theme.palette.background.paper }}
          />
        </Stack>

        <FormControl fullWidth>
          <InputLabel>Hafta kunlarini tanlang</InputLabel>
          <Select
            multiple
            name="weekDays"
            value={form.weekDays}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                weekDays:
                  typeof e.target.value === "string"
                    ? e.target.value.split(",")
                    : e.target.value,
              }))
            }
            label="Hafta kunlarini tanlang"
            renderValue={(selected) => selected.join(", ")}
            sx={{ bgcolor: theme.palette.background.paper }}
          >
            {days.map((day) => (
              <MenuItem key={day} value={day}>
                <Checkbox checked={form.weekDays.includes(day)} />
                {day}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Button
          variant="contained"
          color={editingId ? "secondary" : "primary"}
          onClick={handleAdd}
          sx={{
            width: { xs: "100%", md: "200px" },
            alignSelf: "flex-start",
          }}
        >
          {editingId ? "O'zgartirish" : "Qo'shish"}
        </Button>
      </Stack>

      {/* Jadval */}
      <div style={{ flexGrow: 1, width: "100%", overflowX: "auto" }}>
        <div style={{ minWidth: 700 }}>
          <DataGrid
            rows={filteredRows}
            columns={columns}
            pageSize={pageSize}
            onPageSizeChange={(newSize) => setPageSize(newSize)}
            pageSizeOptions={[10, 50, 100]}
            disableRowSelectionOnClick
            localeText={localeText}
            slots={{ toolbar: GridToolbar }}
            sx={{
              borderRadius: 2,
              bgcolor: theme.palette.background.paper,
              color: theme.palette.text.primary,
              "& .MuiDataGrid-columnHeaders": {
                backgroundColor: darkMode ? "#2c2c2c" : "#f5f5f5",
                fontWeight: "bold",
              },
              "& .MuiTablePagination-root": {
                color: theme.palette.text.primary,
              },
            }}
          />
        </div>
      </div>
    </Paper>
  );
}

export default Lists;
