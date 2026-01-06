// src/components/Davomat.jsx
import React, { useState, useEffect, useMemo } from "react";
import {
  Paper,
  Stack,
  TextField,
  MenuItem,
  Typography,
  Button,
  useTheme,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { Save } from "@mui/icons-material";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import { db } from "../firebase";
import { collection, getDocs, addDoc } from "firebase/firestore";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function Davomat({ darkMode }) {
  const theme = useTheme();
  const [students, setStudents] = useState([]);
  const [rows, setRows] = useState([]);
  const [filter, setFilter] = useState({ group: "", day: "" });
  const [disabledStatus, setDisabledStatus] = useState({});
  const [blockedGroups, setBlockedGroups] = useState({});

  // 1️⃣ O‘quvchilarni olish (Firestore "lists")
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "lists"));
        const data = querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        setStudents(data);
      } catch (error) {
        toast.error("O‘quvchilarni olishda xatolik!");
      }
    };
    fetchStudents();
  }, []);

  // 2️⃣ Guruhlarni chiqarish
  const groups = useMemo(() => {
    return Array.from(
      new Set(students.map((s) => s.group?.trim()).filter(Boolean))
    );
  }, [students]);

  // 3️⃣ Filtr bo‘yicha o‘quvchilarni ajratish
  useEffect(() => {
    if (!filter.group || !filter.day) {
      setRows([]);
      return;
    }

    const filtered = students
      .filter((s) => {
        let weekDays = s.weekDays || [];
        return s.group === filter.group && weekDays.includes(filter.day);
      })
      .map((s, index) => ({
        ...s,
        order: index + 1,
        status: "belgilanmagan",
        late: "",
        id: s.id || crypto.randomUUID(),
      }));

    setRows(filtered);
  }, [filter, students]);

  // 4️⃣ Davomatni belgilash
  const handleAttendance = (id, status) => {
    const todayStr = new Date().toISOString().split("T")[0];
    if (isBlocked(filter.group, todayStr)) return;

    setDisabledStatus((prev) => ({ ...prev, [id]: status }));
    setRows((prev) =>
      prev.map((r) =>
        r.id === id
          ? { ...r, status, late: status === "kechikdi" ? r.late || "" : "" }
          : r
      )
    );
  };

  // 5️⃣ History'dan bloklanganlarni tekshirish
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "history"));
        const data = querySnapshot.docs.map(doc => doc.data());
        
        const newBlocked = {};
        const now = new Date();

        data.forEach((h) => {
          // Firestore timestamp yoki ISO string bo'lishi mumkin
          // Biz quyida ISO string qilib saqlaymiz, shuning uchun new Date(h.created_at) ishlaydi
          const createdAt = new Date(h.created_at);
          const diffHrs = (now - createdAt) / (1000 * 60 * 60);
          
          if (diffHrs < 20) {
            const key = `${h.group}-${h.date}`;
            newBlocked[key] = createdAt.getTime() + 20 * 60 * 60 * 1000;
          }
        });

        setBlockedGroups(newBlocked);
      } catch (error) {
        console.error("History fetch error", error);
      }
    };

    fetchHistory();
    const interval = setInterval(fetchHistory, 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const isBlocked = (group, date) => {
    const key = `${group}-${date}`;
    return blockedGroups[key] && blockedGroups[key] > new Date().getTime();
  };

  const getRemainingTime = (group, date) => {
    const key = `${group}-${date}`;
    if (!blockedGroups[key]) return null;
    const diffMs = blockedGroups[key] - new Date().getTime();
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMin = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return { hours: diffHrs, minutes: diffMin };
  };

  // 6️⃣ Saqlash
  const handleSaveAttendance = async () => {
    if (!filter.group || !filter.day || rows.length === 0)
      return toast.warning("Avval guruh va hafta kunini tanlang!");

    const todayStr = new Date().toISOString().split("T")[0];

    if (isBlocked(filter.group, todayStr)) {
      const remaining = getRemainingTime(filter.group, todayStr);
      return toast.warning(
        `Avval davomat saqlangan! Qolgan vaqt: ${remaining.hours} soat ${remaining.minutes} daqiqa.`
      );
    }

    try {
      const historyData = {
        group: filter.group,
        day: filter.day,
        date: todayStr,
        created_at: new Date().toISOString(), // Vaqtni saqlash
        students: JSON.stringify(rows), // Obyektlarni string qilib saqlash (oson o'qish uchun)
      };

      await addDoc(collection(db, "history"), historyData);

      toast.success("Davomat muvaffaqiyatli saqlandi!");
      setDisabledStatus({});

      const newBlocked = { ...blockedGroups };
      newBlocked[`${filter.group}-${todayStr}`] =
        new Date().getTime() + 20 * 60 * 60 * 1000;
      setBlockedGroups(newBlocked);
    } catch (err) {
      console.error("Davomatni saqlash xatolik:", err);
      toast.error("Xatolik: Davomat saqlanmadi!");
    }
  };

  const columns = [
    { field: "order", headerName: "№", width: 70 },
    { field: "fullName", headerName: "Ism Familiya", flex: 1 },
    { field: "group", headerName: "Guruh", flex: 1 },
    {
      field: "status",
      headerName: "Davomat",
      flex: 1.5,
      renderCell: (params) => {
        const todayStr = new Date().toISOString().split("T")[0];
        const blocked = isBlocked(filter.group, todayStr);

        return (
          <Stack direction="row" spacing={1} sx={{ width: "100%", mt: 1 }}>
            <Button
              variant="contained"
              color="success"
              size="small"
              disabled={disabledStatus[params.row.id] === "keldi" || blocked}
              onClick={() => handleAttendance(params.row.id, "keldi")}
            >
              <CheckIcon fontSize="small" /> Keldi
            </Button>
            <Button
              variant="contained"
              color="error"
              size="small"
              disabled={disabledStatus[params.row.id] === "kelmadi" || blocked}
              onClick={() => handleAttendance(params.row.id, "kelmadi")}
            >
              <CloseIcon fontSize="small" /> Kelmadi
            </Button>
            <Button
              variant="outlined"
              size="small"
              disabled={
                disabledStatus[params.row.id] === "belgilanmagan" || blocked
              }
              onClick={() => handleAttendance(params.row.id, "belgilanmagan")}
            >
              Belgilanmagan
            </Button>
          </Stack>
        );
      },
    },
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
    <Paper sx={{ p: 2, bgcolor: theme.palette.background.default }}>
      <ToastContainer
        position="top-right"
        autoClose={2500}
        theme={darkMode ? "dark" : "light"}
      />

      <Typography variant="h5" fontWeight="bold" mb={2}>
        Guruh Davomat Tizimi
      </Typography>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} mb={2}>
        <TextField
          select
          label="Guruh"
          fullWidth
          value={filter.group}
          onChange={(e) => setFilter({ ...filter, group: e.target.value })}
        >
          {groups.length > 0 ? (
            groups.map((g) => {
              const todayStr = new Date().toISOString().split("T")[0];
              return (
                <MenuItem key={g} value={g} disabled={isBlocked(g, todayStr)}>
                  {g}
                </MenuItem>
              );
            })
          ) : (
            <MenuItem disabled>Guruhlar mavjud emas</MenuItem>
          )}
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

        <Button
          variant="contained"
          color="success"
          startIcon={<Save />}
          onClick={handleSaveAttendance}
          sx={{ width: "100%" }}
        >
          Saqlash
        </Button>
      </Stack>

      {rows.length > 0 ? (
        <div style={{ width: "100%", overflowX: "auto" }}>
          <div style={{ minWidth: 970, height: 500 }}>
            <DataGrid
              rows={rows}
              columns={columns}
              pageSize={8}
              getRowId={(row) => row.id}
              disableRowSelectionOnClick
            />
          </div>
        </div>
      ) : (
        <Typography align="center" mt={3}>
          Iltimos, <b>guruh</b> va <b>hafta kunini</b> tanlang.
        </Typography>
      )}
    </Paper>
  );
}