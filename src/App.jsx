// src/App.js
import React, { useState, useMemo, useEffect } from "react";
import { ThemeProvider, createTheme, CssBaseline, Box } from "@mui/material";
import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Lists from "./components/Lists";
import Davomat from "./components/Davomat";
import DateStatus from "./components/DateStatus";

export default function App() {
  // 🔹 LocalStorage'dan darkMode qiymatini olish
  const [darkMode, setDarkMode] = useState(() => {
    const savedMode = localStorage.getItem("darkMode");
    return savedMode === "true"; // agar true bo‘lsa dark mode
  });

  // 🔹 darkMode o‘zgarsa localStorage’ga saqlash
  useEffect(() => {
    localStorage.setItem("darkMode", darkMode);
  }, [darkMode]);

  // 🔹 MUI mavzusi (dark yoki light)
  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: darkMode ? "dark" : "light",
          background: {
            default: darkMode ? "#121212" : "#f9f9f9",
            paper: darkMode ? "#1e1e1e" : "#ffffff",
          },
          primary: { main: darkMode ? "#90caf9" : "#1976d2" },
          text: {
            primary: darkMode ? "#fff" : "#000",
          },
        },
      }),
    [darkMode]
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Navbar darkMode={darkMode} setDarkMode={setDarkMode} />
      <Box
        sx={{
          p: 3,
          minHeight: "100vh",
          bgcolor: theme.palette.background.default,
          color: theme.palette.text.primary,
          transition: "all 0.3s ease",
        }}
      >
        <Routes>
          <Route path="/" element={<Lists darkMode={darkMode} />} />
          <Route path="/davomat" element={<Davomat darkMode={darkMode} />} />
          <Route path="/tarix" element={<DateStatus darkMode={darkMode} />} />
        </Routes>
      </Box>
    </ThemeProvider>
  );
}
