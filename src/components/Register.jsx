import React, { useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import { TextField, Button, Paper, Stack, Typography } from "@mui/material";
import { toast } from "react-toastify";

const Register = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ fullName: "", email: "", password: "" });

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleRegister = async (e) => {
    e.preventDefault();

    if (!form.fullName || !form.email || !form.password) {
      toast.error("Barcha maydonlarni to‘ldiring!");
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: { full_name: form.fullName },
      },
    });

    if (error) {
      console.error("Ro‘yxatdan o‘tishda xato:", error.message);
      toast.error("Xatolik yuz berdi!");
    } else {
      toast.success("Ro‘yxatdan o‘tish muvaffaqiyatli!");
      navigate("/login");
    }
  };

  return (
    <Paper sx={{ p: 4, maxWidth: 400, mx: "auto", mt: 10 }}>
      <Typography variant="h5" mb={2}>
        📝 Ro‘yxatdan o‘tish
      </Typography>
      <form onSubmit={handleRegister}>
        <Stack spacing={2}>
          <TextField
            label="To‘liq ism"
            name="fullName"
            value={form.fullName}
            onChange={handleChange}
          />
          <TextField
            label="Email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
          />
          <TextField
            label="Parol"
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
          />
          <Button type="submit" variant="contained">
            Ro‘yxatdan o‘tish
          </Button>
          <Button onClick={() => navigate("/login")}>Tizimga kirish</Button>
        </Stack>
      </form>
    </Paper>
  );
};

export default Register;
