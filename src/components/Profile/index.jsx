import React, { useEffect, useState } from "react";
import {
  Paper,
  Typography,
  Box,
  Avatar,
  Button,
  Stack,
  TextField,
  InputAdornment,
  IconButton,
  CircularProgress,
} from "@mui/material";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../supabaseClient";
import { useNavigate } from "react-router-dom";
import { AiFillEye, AiFillEyeInvisible } from "react-icons/ai";
import { toast } from "react-toastify";

const Profile = () => {
  const { user, logout, refreshUser, userAvatar, setUserAvatar } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!user) return navigate("/login");
    setForm({ email: user.email, password: "" });
    setLoading(false);
  }, [user, navigate]);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleUpdate = async () => {
    try {
      if (form.email && form.email !== user.email) {
        const { error: emailError } = await supabase.auth.updateUser({
          email: form.email,
        });
        if (emailError) return toast.error(emailError.message);
      }

      if (form.password) {
        const { error: passError } = await supabase.auth.updateUser({
          password: form.password,
        });
        if (passError) return toast.error(passError.message);
      }

      toast.success("Profil ma'lumotlari yangilandi!");
      setForm({ ...form, password: "" });
      refreshUser();
    } catch (err) {
      console.error(err);
      toast.error("Yangilashda xatolik yuz berdi");
    }
  };

  // Avatarga rasm yuklash
  const handleAvatarUpload = async (e) => {
    try {
      setUploading(true);
      const file = e.target.files[0];
      if (!file) return;

      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}.${fileExt}`;
      const filePath = fileName; // **avatars bucket ichida to‘g‘ri path**

      // Supabase Storage-ga yuklash
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Public URL olish
      const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);

      if (!data?.publicUrl) {
        toast.error("Rasm URL olinmadi. Bucket public ekanligini tekshiring!");
        return;
      }

      // User metadata update
      await supabase.auth.updateUser({
        data: { avatarUrl: data.publicUrl },
      });

      setUserAvatar(data.publicUrl); // darhol Profile va Navbar yangilanadi
      toast.success("Avatar yangilandi!");
    } catch (err) {
      console.error(err);
      toast.error("Avatar yuklashda xatolik yuz berdi");
    } finally {
      setUploading(false);
    }
  };

  const handleLogout = async () => {
    if (logout) await logout();
    navigate("/login");
  };

  if (loading)
    return (
      <Box display="flex" justifyContent="center" alignItems="center" mt={10}>
        <CircularProgress />
      </Box>
    );

  return (
    <Paper sx={{ p: 4, maxWidth: 600, mx: "auto", mt: 10 }}>
      <Typography sx={{ fontSize: "15px", mb: "10px" }}>
        {user.email}
      </Typography>
      <Box display="flex" alignItems="center" gap={2} mb={3}>
        <Avatar
          sx={{ width: 64, height: 64, cursor: "pointer" }}
          src={userAvatar || ""}
        >
          {!userAvatar && user.email.charAt(0).toUpperCase()}
        </Avatar>

        <label htmlFor="avatar-upload">
          <input
            style={{ display: "none" }}
            id="avatar-upload"
            type="file"
            accept="image/*"
            onChange={handleAvatarUpload}
          />
          <Button variant="outlined" component="span" disabled={uploading}>
            {uploading ? "Yuklanmoqda..." : "Rasm o'zgartirish"}
          </Button>
        </label>
      </Box>

      <Stack spacing={2}>
        <TextField
          label="Email"
          name="email"
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
          placeholder="Yangi parol kiriting"
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
        <Button variant="contained" color="primary" onClick={handleUpdate}>
          Yangilash
        </Button>
        <Button variant="contained" color="error" onClick={handleLogout}>
          Logout
        </Button>
      </Stack>
    </Paper>
  );
};

export default Profile;
