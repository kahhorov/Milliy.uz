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
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import RemoveCircleOutlineIcon from "@mui/icons-material/RemoveCircleOutline";

const API_URL = "https://server-supabase-3k3k.onrender.com/users";
const HISTORY_URL =
  "https://server-supabase-3k3k.onrender.com/attendanceHistory";

export default function Davomat({ darkMode }) {
  const theme = useTheme();
  const [rows, setRows] = useState([]);
  const [filter, setFilter] = useState({ group: "", day: "" });
  const [disabledStatus, setDisabledStatus] = useState({});

  useEffect(() => {
    axios.get(API_URL).then((res) => setRows(res.data));
  }, []);

  const groups = useMemo(
    () => Array.from(new Set(rows.map((r) => r.group).filter(Boolean))),
    [rows]
  );

  const filteredRows = useMemo(() => {
    if (!filter.group || !filter.day) return [];
    return rows
      .filter(
        (r) =>
          r.group === filter.group &&
          Array.isArray(r.weekDays) &&
          r.weekDays.includes(filter.day)
      )
      .map((r, i) => ({ ...r, order: i + 1 }));
  }, [rows, filter]);

  const handleAttendance = (id, status) => {
    setDisabledStatus((prev) => ({ ...prev, [id]: status }));
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
  };

  const handleSaveAttendance = async () => {
    if (filteredRows.length === 0) {
      toast.warning("Avval guruhni tanlang va davomat belgilang.");
      return;
    }

    const date = new Date();
    const formattedDate = `${date.getFullYear()}-${String(
      date.getMonth() + 1
    ).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

    const students = filteredRows.map((r, index) => ({
      id: index + 1,
      fullName: r.fullName,
      group: r.group,
      status: r.status || "belgilanmagan",
    }));

    try {
      const { data: history } = await axios.get(HISTORY_URL);
      const newId =
        history.length > 0 ? Math.max(...history.map((h) => h.id)) + 1 : 1;

      const alreadyExists = history.some(
        (item) =>
          item.date === formattedDate &&
          item.group === filter.group &&
          item.day === filter.day
      );

      if (alreadyExists) {
        toast.warning("Bu guruhning bugungi davomati allaqachon olindi!");
        return;
      }

      const record = {
        id: String(newId),
        date: formattedDate,
        group: filter.group,
        day: filter.day,
        students,
      };

      await axios.post(HISTORY_URL, record);
      setDisabledStatus({});
      toast.success("Davomat muvaffaqiyatli saqlandi!");
    } catch (error) {
      console.error("Xatolik:", error);
      toast.error("Xatolik: Davomat saqlanmadi!");
    }
  };

  const columns = [
    { field: "order", headerName: "№", width: 80 },
    { field: "fullName", headerName: "Ism Familiya", flex: 1 },
    { field: "group", headerName: "Guruh", flex: 1 },
    {
      field: "status",
      headerName: "Davomat",
      flex: 1.6,
      renderCell: (params) => (
        <Stack
          direction="row"
          spacing={1}
          sx={{
            width: "100%",
            "& .MuiButton-root": {
              fontSize: "12px",
              minWidth: "100px",
              flex: 1,
              textTransform: "none",
              whiteSpace: "nowrap",
              padding: "6px 8px",
            },
          }}
        >
          <Button
            variant="contained"
            color="success"
            disabled={disabledStatus[params.row.id] === "keldi"}
            onClick={() => handleAttendance(params.row.id, "keldi")}
          >
            <CheckIcon sx={{ mr: 0.5 }} /> Keldi
          </Button>
          <Button
            variant="contained"
            color="error"
            disabled={disabledStatus[params.row.id] === "kelmadi"}
            onClick={() => handleAttendance(params.row.id, "kelmadi")}
          >
            <CloseIcon sx={{ mr: 0.5 }} /> Kelmadi
          </Button>
          <Button
            variant="outlined"
            color="warning"
            disabled={disabledStatus[params.row.id] === ""}
            onClick={() => handleAttendance(params.row.id, "")}
          >
            <RemoveCircleOutlineIcon sx={{ mr: 0.5 }} /> Tanlanmagan
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
    <Paper
      sx={{
        minHeight: "100vh",
        bgcolor: theme.palette.background.default,
        color: theme.palette.text.primary,
        transition: "all 0.3s ease",
      }}
      elevation={0}
    >
      <ToastContainer
        position="top-right"
        autoClose={2500}
        theme={darkMode ? "dark" : "light"}
      />

      <Typography variant="h5" fontWeight="bold" mb={3}>
        Guruh Davomat Tizimi
      </Typography>

      {/* Filtrlar */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        mb={2}
        flexWrap="wrap"
        sx={{
          "& .MuiTextField-root": { flex: 1, minWidth: "180px" },
        }}
      >
        <TextField
          select
          label="Guruh"
          fullWidth
          value={filter.group}
          onChange={(e) => setFilter({ ...filter, group: e.target.value })}
        >
          {groups.map((g) => (
            <MenuItem key={g} value={g}>
              {g}
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

      {/* Jadval responsive */}
      {filteredRows.length > 0 ? (
        <div
          style={{
            width: "100%",
            overflowX: "auto",
            borderRadius: 8,
            backgroundColor: theme.palette.background.paper,
          }}
        >
          <div style={{ minWidth: 900, height: 500 }}>
            <DataGrid
              rows={filteredRows}
              columns={columns}
              pageSize={10}
              disableRowSelectionOnClick
              sx={{
                color: theme.palette.text.primary,
                border: 0,
                "& .MuiDataGrid-columnHeaders": {
                  backgroundColor: darkMode ? "#333" : "#f5f5f5",
                },
                "& .MuiDataGrid-cell": {
                  borderColor: darkMode ? "#444" : "#ddd",
                },
              }}
            />
          </div>
        </div>
      ) : (
        <Typography sx={{ mt: 3, textAlign: "center" }}>
          Iltimos, <b>guruh</b> va <b>hafta kunini</b> tanlang.
        </Typography>
      )}
    </Paper>
  );
}
