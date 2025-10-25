import React, { useState, useEffect, useMemo } from "react";
import {
  Paper,
  Stack,
  TextField,
  MenuItem,
  Typography,
  Button,
  Switch,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { LightMode, DarkMode, Save } from "@mui/icons-material";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";

const API_URL = "https://milliy-server-1.onrender.com/users";
const HISTORY_URL = "https://milliy-server-1.onrender.com/attendanceHistory";

export default function Attendance({ darkMode, setDarkMode }) {
  const [rows, setRows] = useState([]);
  const [filter, setFilter] = useState({
    year: "",
    month: "",
    day: "",
    time: "",
  });

  // 🔹 Front-endda qaysi tugma bosilganini saqlaymiz
  const [disabledStatus, setDisabledStatus] = useState({});

  // 🔹 Foydalanuvchilarni yuklash
  useEffect(() => {
    axios.get(API_URL).then((res) => setRows(res.data));
  }, []);

  // 🔹 Vaqtlarni olish
  const times = useMemo(
    () => Array.from(new Set(rows.map((r) => r.time).filter(Boolean))),
    [rows]
  );

  // 🔹 Filtrlash
  const filteredRows = useMemo(() => {
    if (!filter.year || !filter.month || !filter.day || !filter.time) return [];
    return rows
      .filter((r) => {
        const matchesYear = Number(r.year) === Number(filter.year);
        const matchesMonth = r.month === filter.month;
        const matchesTime = r.time === filter.time;
        const matchesDay =
          Array.isArray(r.weekDays) && r.weekDays.includes(filter.day);
        return matchesYear && matchesMonth && matchesTime && matchesDay;
      })
      .map((r, i) => ({ ...r, order: i + 1 }));
  }, [rows, filter]);

  // 🔹 Keldi / Kelmadi tugmasi bosilganda front-endda disabled qilamiz
  const handleAttendance = (id, status) => {
    setDisabledStatus((prev) => ({ ...prev, [id]: status }));
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
  };

  // 🔹 Saqlash tugmasi bosilganda DB-ga yozish va buttonlarni reset qilish
  const handleSaveAttendance = async () => {
    if (filteredRows.length === 0) {
      toast.warning("Avval guruhni tanlang va davomat belgilang.");
      return;
    }

    const date = new Date();
    const formattedDate = `${date.getFullYear()}-${String(
      date.getMonth() + 1
    ).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

    const record = {
      id: Date.now(),
      date: formattedDate,
      year: filter.year,
      month: filter.month,
      day: filter.day,
      time: filter.time,
      students: filteredRows.map((r) => ({
        fullName: r.fullName,
        group: r.group,
        status: r.status || "belgilanmagan",
      })),
    };

    try {
      await axios.post(HISTORY_URL, record);

      // 🔹 Saqlangach statuslarni reset qilamiz
      setDisabledStatus({});
      setRows((prev) =>
        prev.map((r) =>
          r.time === filter.time &&
          r.month === filter.month &&
          r.year === filter.year &&
          Array.isArray(r.weekDays) &&
          r.weekDays.includes(filter.day)
            ? { ...r, status: "" }
            : r
        )
      );

      toast.success("Davomat muvaffaqiyatli saqlandi va buttonlar aktiv!");
    } catch (error) {
      toast.error("Xatolik: Davomat saqlanmadi!");
    }
  };

  // 🔹 Jadval ustunlari
  const columns = [
    { field: "order", headerName: "№", width: 80 },
    { field: "fullName", headerName: "Ism Familiya", flex: 1 },
    { field: "group", headerName: "Guruh", flex: 1 },
    {
      field: "status",
      headerName: "Davomat",
      width: 220,
      renderCell: (params) => (
        <Stack direction="row" spacing={1} sx={{ width: "100%" }}>
          <Button
            fullWidth
            variant="contained"
            color="success"
            disabled={disabledStatus[params.row.id] === "keldi"}
            onClick={() => handleAttendance(params.row.id, "keldi")}
          >
            <CheckIcon /> Keldi
          </Button>
          <Button
            fullWidth
            variant="contained"
            color="error"
            disabled={disabledStatus[params.row.id] === "kelmadi"}
            onClick={() => handleAttendance(params.row.id, "kelmadi")}
          >
            <CloseIcon /> Kelmadi
          </Button>
        </Stack>
      ),
    },
  ];

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
  const days = [
    "Dushanba",
    "Seshanba",
    "Chorshanba",
    "Payshanba",
    "Juma",
    "Shanba",
    "Yakshanba",
  ];

  return (
    <Paper
      sx={{
        p: 3,
        bgcolor: darkMode ? "#121212" : "#fff",
        color: darkMode ? "#fff" : "#000",
        minHeight: "100vh",
      }}
    >
      <ToastContainer position="top-right" autoClose={2500} theme="colored" />

      {/* 🔹 Sarlavha va rejim */}
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Typography variant="h5" fontWeight="bold">
          Guruh Davomat Tizimi
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

      {/* 🔹 Filtrlar */}
      <Stack
        direction="row"
        spacing={2}
        mb={2}
        flexWrap="wrap"
        sx={{ "& .MuiTextField-root": { flex: 1, minWidth: "180px" } }}
      >
        <TextField
          label="Yil"
          type="number"
          fullWidth
          value={filter.year}
          onChange={(e) => setFilter({ ...filter, year: e.target.value })}
        />
        <TextField
          select
          label="Oy"
          fullWidth
          value={filter.month}
          onChange={(e) => setFilter({ ...filter, month: e.target.value })}
        >
          {months.map((m) => (
            <MenuItem key={m} value={m}>
              {m}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          label="Hafta kuni"
          fullWidth
          value={filter.day}
          onChange={(e) => setFilter({ ...filter, day: e.target.value })}
        >
          {days.map((d) => (
            <MenuItem key={d} value={d}>
              {d}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          label="Vaqt"
          fullWidth
          value={filter.time}
          onChange={(e) => setFilter({ ...filter, time: e.target.value })}
          autoComplete="off"
        >
          {times.map((t) => (
            <MenuItem key={t} value={t}>
              {t}
            </MenuItem>
          ))}
        </TextField>

        <Button
          variant="contained"
          color="success"
          startIcon={<Save />}
          sx={{ flex: 1, minWidth: "180px" }}
          onClick={handleSaveAttendance}
        >
          Saqlash
        </Button>
      </Stack>

      {/* 🔹 Jadval */}
      {filteredRows.length > 0 ? (
        <div style={{ height: 500, width: "100%" }}>
          <DataGrid
            rows={filteredRows}
            columns={columns}
            pageSize={10}
            disableRowSelectionOnClick
          />
        </div>
      ) : (
        <Typography sx={{ mt: 3, textAlign: "center" }}>
          Iltimos, <b>yil, oy, hafta kuni</b> va <b>vaqtni</b> tanlang.
        </Typography>
      )}
    </Paper>
  );
}
