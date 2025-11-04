import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import {
  TextField,
  Button,
  Paper,
  Stack,
  Typography,
  InputAdornment,
  IconButton,
} from "@mui/material";
import { toast } from "react-toastify";
import { AiFillEye, AiFillEyeInvisible } from "react-icons/ai";

const Login = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    // Agar localStorage'da saqlangan bo'lsa, avtomatik to'ldirish
    const savedEmail = localStorage.getItem("savedEmail");
    const savedPassword = localStorage.getItem("savedPassword");
    if (savedEmail && savedPassword) {
      setForm({ email: savedEmail, password: savedPassword });
    }
  }, []);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!form.email || !form.password) {
      toast.error("Email va parolni kiriting!");
      return;
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    });

    if (error) {
      console.error("Login xatosi:", error.message);
      toast.error("Email yoki parol xato!");
    } else {
      toast.success("Tizimga kirdingiz!");
      // Saqlash login va parolni localStorage ga
      localStorage.setItem("savedEmail", form.email);
      localStorage.setItem("savedPassword", form.password);
      navigate("/lists");
    }
  };

  return (
    <Paper sx={{ p: 4, maxWidth: 400, mx: "auto", mt: 10 }}>
      <Typography variant="h5" mb={2}>
        🔐 Tizimga kirish
      </Typography>
      <form onSubmit={handleLogin}>
        <Stack spacing={2}>
          <TextField
            label="Email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            fullWidth
          />
          <TextField
            label="Parol"
            name="password"
            type={showPassword ? "text" : "password"}
            value={form.password}
            onChange={handleChange}
            fullWidth
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                  >
                    {showPassword ? <AiFillEyeInvisible /> : <AiFillEye />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <Button type="submit" variant="contained">
            Kirish
          </Button>
          <Button onClick={() => navigate("/register")}>
            Ro'yxatdan o'tish
          </Button>
        </Stack>
      </form>
    </Paper>
  );
};

export default Login;
