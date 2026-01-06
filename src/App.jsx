// src/App.js
import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { createTheme, ThemeProvider, CssBaseline } from "@mui/material";
import Navbar from "./components/Navbar";
import Lists from "./components/Lists";
import Davomat from "./components/Davomat";
import DateStatus from "./components/DateStatus";

function App() {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const savedMode = JSON.parse(localStorage.getItem("darkMode"));
    if (savedMode !== null) setDarkMode(savedMode);
  }, []);

  const theme = createTheme({
    palette: {
      mode: darkMode ? "dark" : "light",
    },
  });

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Navbar darkMode={darkMode} setDarkMode={setDarkMode} />
        <Routes>
          {/* Asosiy sahifa Lists bo'ladi */}
          <Route path="/" element={<Navigate to="/lists" />} />
          <Route path="/lists" element={<Lists />} />
          <Route path="/davomat" element={<Davomat darkMode={darkMode} />} />
          <Route path="/datestatus" element={<DateStatus darkMode={darkMode} />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;