import React, { useState, useEffect, useMemo } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Login from "./components/Login";
import Register from "./components/Register";
import Lists from "./components/Lists";
import Davomat from "./components/Davomat";
import DateStatus from "./components/DateStatus";
import Profile from "./components/Profile";
import Navbar from "./components/Navbar";
import { ThemeProvider, createTheme, CssBaseline } from "@mui/material";

// Private Route komponenti
const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <p>Yuklanmoqda...</p>;
  return user ? children : <Navigate to="/login" />;
};

// Layout komponenti (navbarni yashirish va ko‘rsatish)
const Layout = ({ children, darkMode, setDarkMode }) => {
  const location = useLocation();
  const hideNavbar =
    location.pathname === "/login" || location.pathname === "/register";

  return (
    <>
      {!hideNavbar && <Navbar darkMode={darkMode} setDarkMode={setDarkMode} />}
      {children}
    </>
  );
};

const App = () => {
  // 1️⃣ Initial darkMode state localStorage dan o'qiladi
  const [darkMode, setDarkMode] = useState(() => {
    try {
      const savedMode = localStorage.getItem("darkMode");
      return savedMode === "true" ? true : false;
    } catch (err) {
      console.error("Dark mode ni localStorage dan yuklashda xatolik:", err);
      return false; // default light mode
    }
  });

  // 2️⃣ Dark mode o‘zgarganda localStorage ga saqlash
  useEffect(() => {
    try {
      localStorage.setItem("darkMode", darkMode.toString());
    } catch (err) {
      console.error("Dark mode ni localStorage ga saqlashda xatolik:", err);
    }
  }, [darkMode]);

  // 3️⃣ MUI theme yaratish
  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: darkMode ? "dark" : "light",
          primary: { main: "#1976d2" },
          secondary: { main: "#dc004e" },
        },
      }),
    [darkMode]
  );

  return (
    <AuthProvider>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Router>
          <Layout darkMode={darkMode} setDarkMode={setDarkMode}>
            <Routes>
              <Route path="/" element={<Navigate to="/login" />} />
              <Route
                path="/login"
                element={
                  <Login darkMode={darkMode} setDarkMode={setDarkMode} />
                }
              />
              <Route
                path="/register"
                element={
                  <Register darkMode={darkMode} setDarkMode={setDarkMode} />
                }
              />
              <Route
                path="/lists"
                element={
                  <PrivateRoute>
                    <Lists darkMode={darkMode} setDarkMode={setDarkMode} />
                  </PrivateRoute>
                }
              />
              <Route
                path="/davomat"
                element={
                  <PrivateRoute>
                    <Davomat darkMode={darkMode} setDarkMode={setDarkMode} />
                  </PrivateRoute>
                }
              />
              <Route
                path="/datestatus"
                element={
                  <PrivateRoute>
                    <DateStatus darkMode={darkMode} setDarkMode={setDarkMode} />
                  </PrivateRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <PrivateRoute>
                    <Profile darkMode={darkMode} setDarkMode={setDarkMode} />
                  </PrivateRoute>
                }
              />
            </Routes>
          </Layout>
        </Router>
      </ThemeProvider>
    </AuthProvider>
  );
};

export default App;
