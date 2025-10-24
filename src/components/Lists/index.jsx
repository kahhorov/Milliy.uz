import React, { useState, useMemo, useEffect } from "react";
import {
  Paper,
  Stack,
  TextField,
  Button,
  IconButton,
  Typography,
  Checkbox,
  Switch,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  FormControlLabel,
} from "@mui/material";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import { Edit, Delete, LightMode, DarkMode, Search } from "@mui/icons-material";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import axios from "axios";

const API_URL = "http://localhost:3001/users";

function Lists({ darkMode, setDarkMode }) {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState({
    fullName: "",
    phoneNumber: "",
    time: "",
    month: "",
    year: new Date().getFullYear(),
    weekDays: [],
  });
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [filterMonth, setFilterMonth] = useState("Barchasi");
  const [showCheckedOnly, setShowCheckedOnly] = useState(false); // ✅ Faqat belgilanganni ko‘rsatish
  const isSmall = useMediaQuery("(max-width:600px)");

  // 🔹 Haftalik kunlar
  const days = [
    "Dushanba",
    "Seshanba",
    "Chorshanba",
    "Payshanba",
    "Juma",
    "Shanba",
    "Yakshanba",
  ];

  // 🔹 Ma’lumotlarni olish
  const getData = async () => {
    const res = await axios.get(API_URL);
    const sorted = res.data.sort((a, b) => a.order - b.order);
    setRows(sorted);
  };

  useEffect(() => {
    getData();
  }, []);

  // 🔹 Ismni formatlash
  const formatName = (name) =>
    name
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");

  // 🔹 Input o‘zgarishi
  const handleChange = (e) => {
    let value = e.target.value;
    if (e.target.name === "fullName") value = formatName(value);
    setForm({ ...form, [e.target.name]: value });
  };

  // 🔹 Qo‘shish yoki tahrirlash
  const handleAdd = async () => {
    if (
      !form.fullName ||
      !form.phoneNumber ||
      !form.time ||
      !form.month ||
      !form.year ||
      form.weekDays.length === 0
    )
      return alert("Iltimos, barcha maydonlarni to‘ldiring!");

    if (editingId) {
      await axios.patch(`${API_URL}/${editingId}`, form);
      setEditingId(null);
    } else {
      const newOrder = rows.length + 1;
      const newUser = {
        order: newOrder,
        ...form,
        checked: false,
      };
      await axios.post(API_URL, newUser);
    }

    await getData();
    setForm({
      fullName: "",
      phoneNumber: "",
      time: "",
      month: "",
      year: new Date().getFullYear(),
      weekDays: [],
    });
  };

  // 🔹 Belgilash
  const toggleCheck = async (id) => {
    const user = rows.find((r) => r.id === id);
    if (!user) return;

    await axios.patch(`${API_URL}/${id}`, { checked: !user.checked });
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, checked: !r.checked } : r))
    );
  };

  // 🔹 Tahrirlash
  const handleEdit = (row) => {
    setForm({
      fullName: row.fullName,
      phoneNumber: row.phoneNumber,
      time: row.time,
      month: row.month,
      year: row.year,
      weekDays: row.weekDays || [],
    });
    setEditingId(row.id);
  };

  // 🔹 O‘chirish
  const handleDelete = async (id) => {
    await axios.delete(`${API_URL}/${id}`);
    await getData();
  };

  // 🔹 Filter, qidiruv va “Tanlanganlar” funksiyasi
  const filteredRows = useMemo(() => {
    let filtered = rows;
    if (filterMonth !== "Barchasi")
      filtered = filtered.filter(
        (r) => r.month.toLowerCase() === filterMonth.toLowerCase()
      );
    if (search.trim()) {
      filtered = filtered.filter(
        (r) =>
          r.fullName.toLowerCase().includes(search.toLowerCase()) ||
          r.phoneNumber.toLowerCase().includes(search.toLowerCase())
      );
    }
    if (showCheckedOnly) {
      filtered = filtered.filter((r) => r.checked === true);
    }
    return filtered.map((r, i) => ({ ...r, order: i + 1 }));
  }, [rows, search, filterMonth, showCheckedOnly]);

  // 🔹 Jadval ustunlari
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
      sortable: false,
      disableColumnMenu: true,
    },
    { field: "order", headerName: "№", width: 70 },
    { field: "fullName", headerName: "Ism Familiya", flex: 1 },
    { field: "phoneNumber", headerName: "Telefon raqam", flex: 1 },
    { field: "time", headerName: "Vaqt", width: 120 },
    { field: "month", headerName: "Oy", width: 120 },
    { field: "year", headerName: "Yil", width: 100 },
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
              title="O‘chirish"
            >
              <Delete />
            </IconButton>
          </Stack>
        ),
    },
  ];

  // 🔹 Oylik ro‘yxat
  const months = [
    "Yanvar",
    "Fevral",
    "Mart",
    "Aprel",
    "May",
    "Iyun",
    "Iyul",
    "Avgust",
    "Sentabr",
    "Oktabr",
    "Noyabr",
    "Dekabr",
  ];

  // 🔹 O‘zbekcha tarjimalar
  const localeText = {
    toolbarColumns: "Ustunlar",
    toolbarFilters: "Filtrlar",
    toolbarDensity: "Ko‘rinish",
    toolbarExport: "Yuklab olish",
    noRowsLabel: "Ma’lumot topilmadi",
    noResultsOverlayLabel: "Mos keluvchi natija yo‘q",
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        width: "100%",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        gap: 2,
        bgcolor: darkMode ? "#121212" : "#fff",
        color: darkMode ? "white" : "black",
        borderRadius: 0,
      }}
    >
      {/* 🔹 Sarlavha */}
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        mb={1}
      >
        <Typography variant={isSmall ? "h6" : "h5"} fontWeight="bold">
          O‘quvchilar ro‘yxati
        </Typography>

        <Stack direction="row" alignItems="center" spacing={1}>
          <LightMode />
          <Switch
            checked={darkMode}
            onChange={() => setDarkMode(!darkMode)}
            color="default"
          />
          <DarkMode />
        </Stack>
      </Stack>

      {/* 🔹 Qidiruv va Tanlanganlar */}
      <Stack
        direction={isSmall ? "column" : "row"}
        spacing={2}
        alignItems="center"
      >
        <Stack direction="row" alignItems="center" flex={1}>
          <TextField
            label="Ism yoki telefon orqali qidirish"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            fullWidth
          />
        </Stack>
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

      {/* 🔹 Forma */}
      <Stack direction="column" spacing={2}>
        <Stack direction={isSmall ? "column" : "row"} spacing={2}>
          <TextField
            label="Ism Familiya"
            name="fullName"
            value={form.fullName}
            onChange={handleChange}
            fullWidth
          />
          <TextField
            label="Telefon raqam"
            name="phoneNumber"
            value={form.phoneNumber}
            onChange={handleChange}
            fullWidth
          />
          <TextField
            label="Vaqt (masalan: 14:00)"
            name="time"
            value={form.time}
            onChange={handleChange}
            fullWidth
          />
          <TextField
            select
            label="Oy tanlang"
            name="month"
            value={form.month}
            onChange={handleChange}
            fullWidth
          >
            {months.map((m) => (
              <MenuItem key={m} value={m}>
                {m}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="Yil"
            name="year"
            type="number"
            value={form.year}
            onChange={handleChange}
            fullWidth
            inputProps={{ min: 2000, max: 2100 }}
          />
        </Stack>

        {/* 🔹 Hafta kunlari */}
        <FormControl fullWidth>
          <InputLabel>Hafta kunlarini tanlang</InputLabel>
          <Select
            multiple
            name="weekDays"
            value={form.weekDays}
            onChange={handleChange}
            label="Hafta kunlarini tanlang"
            renderValue={(selected) => selected.join(", ")}
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
          sx={{ width: "200px", alignSelf: "flex-start" }}
        >
          {editingId ? "O‘zgartirish" : "Qo‘shish"}
        </Button>
      </Stack>

      {/* 🔹 Jadval */}
      <div style={{ flexGrow: 1, width: "100%" }}>
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
            bgcolor: darkMode ? "#1e1e1e" : "white",
            color: darkMode ? "#fff" : "#000",
            "& .MuiDataGrid-columnHeaders": {
              backgroundColor: darkMode ? "#333" : "#f5f5f5",
              color: darkMode ? "#fff" : "#000",
              fontWeight: "bold",
            },
          }}
        />
      </div>
    </Paper>
  );
}

export default function App() {
  const [darkMode, setDarkMode] = useState(false);

  const theme = useMemo(
    () =>
      createTheme({
        palette: { mode: darkMode ? "dark" : "light" },
      }),
    [darkMode]
  );

  return (
    <ThemeProvider theme={theme}>
      <Lists darkMode={darkMode} setDarkMode={setDarkMode} />
    </ThemeProvider>
  );
}
