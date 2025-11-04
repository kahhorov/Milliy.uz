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
import { supabase } from "../../supabaseClient";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function Davomat({ darkMode }) {
  const theme = useTheme();
  const [user, setUser] = useState(null);
  const [students, setStudents] = useState([]);
  const [rows, setRows] = useState([]);
  const [filter, setFilter] = useState({ group: "", day: "" });
  const [disabledStatus, setDisabledStatus] = useState({});
  const [savedHistory, setSavedHistory] = useState([]);

  // 1️⃣ Foydalanuvchini olish
  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();
      if (error || !user) return toast.error("Foydalanuvchi topilmadi!");
      setUser(user);
    };
    fetchUser();
  }, []);

  // 2️⃣ O‘quvchilarni olish
  useEffect(() => {
    if (!user) return;
    const fetchStudents = async () => {
      const { data, error } = await supabase
        .from("lists")
        .select('id, fullName, "group", weekDays, user_id')
        .eq("user_id", user.id);
      if (error) return toast.error("O‘quvchilarni olishda xatolik!");
      setStudents(data || []);
    };
    fetchStudents();
  }, [user]);

  // 3️⃣ Guruhlarni chiqarish
  const groups = useMemo(() => {
    return Array.from(
      new Set(students.map((s) => s.group?.trim()).filter(Boolean))
    );
  }, [students]);

  // 4️⃣ Filtr bo‘yicha o‘quvchilarni ajratish
  useEffect(() => {
    if (!filter.group || !filter.day) {
      setRows([]);
      return;
    }

    const filtered = students
      .filter((s) => {
        let weekDays = [];
        try {
          weekDays = Array.isArray(s.weekDays)
            ? s.weekDays
            : JSON.parse(s.weekDays || "[]");
        } catch (e) {
          console.error("weekDays parse error:", e);
        }
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

  // 5️⃣ Davomatni belgilash
  const handleAttendance = (id, status) => {
    setDisabledStatus((prev) => ({ ...prev, [id]: status }));
    setRows((prev) =>
      prev.map((r) =>
        r.id === id
          ? { ...r, status, late: status === "kechikdi" ? r.late || "" : "" }
          : r
      )
    );
  };

  // 6️⃣ Avval saqlangan davomatlarni olish
  useEffect(() => {
    if (!user) return;
    const fetchHistory = async () => {
      const { data, error } = await supabase
        .from("history")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (!error && data) setSavedHistory(data);
    };
    fetchHistory();
  }, [user]);

  // 7️⃣ Saqlash Supabase history jadvaliga
  const handleSaveAttendance = async () => {
    if (!filter.group || !filter.day || rows.length === 0)
      return toast.warning("Avval guruh va hafta kunini tanlang!");
    if (!user) return toast.error("Foydalanuvchi aniqlanmadi!");

    const today = new Date();
    const todayStr = today.toISOString().split("T")[0]; // YYYY-MM-DD

    // Shu guruh va bugungi kun uchun avval saqlanganini tekshirish
    const existing = savedHistory.find(
      (h) => h.group === filter.group && h.date === todayStr
    );

    if (existing) {
      const createdAt = new Date(existing.created_at);
      const now = new Date();
      const diffMs = now - createdAt; // millisekundlarda
      const diffHrs = diffMs / (1000 * 60 * 60); // soatga o'tkazish

      if (diffHrs < 20) {
        const remaining = Math.ceil(20 - diffHrs);
        return toast.warning(
          `Avval davomat saqlangan! ${remaining} soat ichida qayta saqlash mumkin emas.`
        );
      }
    }

    try {
      const historyData = {
        user_id: user.id,
        group: filter.group,
        day: filter.day,
        date: todayStr,
        students: JSON.stringify(rows),
      };

      const { data, error } = await supabase
        .from("history")
        .insert([historyData])
        .select();

      if (error) throw error;

      toast.success("Davomat muvaffaqiyatli saqlandi!");
      setDisabledStatus({});
      setSavedHistory((prev) => [data[0], ...prev]);
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
      renderCell: (params) => (
        <Stack direction="row" spacing={1} sx={{ width: "100%", mt: 1 }}>
          <Button
            variant="contained"
            color="success"
            size="small"
            disabled={disabledStatus[params.row.id] === "keldi"}
            onClick={() => handleAttendance(params.row.id, "keldi")}
          >
            <CheckIcon fontSize="small" /> Keldi
          </Button>
          <Button
            variant="contained"
            color="error"
            size="small"
            disabled={disabledStatus[params.row.id] === "kelmadi"}
            onClick={() => handleAttendance(params.row.id, "kelmadi")}
          >
            <CloseIcon fontSize="small" /> Kelmadi
          </Button>
          <Button
            variant="outlined"
            size="small"
            disabled={disabledStatus[params.row.id] === "belgilanmagan"}
            onClick={() => handleAttendance(params.row.id, "belgilanmagan")}
          >
            Belgilanmagan
          </Button>
        </Stack>
      ),
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
            groups.map((g) => (
              <MenuItem key={g} value={g}>
                {g}
              </MenuItem>
            ))
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
