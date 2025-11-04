import React, { useState, useEffect } from "react";
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
import Profile from "./components/Profile"; // <-- Profile komponentini import qildik
import Navbar from "./components/Navbar";

// 🔐 Maxfiy sahifalarni himoya qilish
const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <p>Yuklanmoqda...</p>;
  return user ? children : <Navigate to="/login" />;
};

// 🔝 Navbarni faqat login bo‘lganda ko‘rsatadigan o‘rama komponent
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
  const [darkMode, setDarkMode] = useState(false);

  // LocalStorage dan darkMode yuklash
  useEffect(() => {
    const savedMode = JSON.parse(localStorage.getItem("darkMode"));
    if (savedMode !== null) setDarkMode(savedMode);
  }, []);

  return (
    <AuthProvider>
      <Router>
        <Layout darkMode={darkMode} setDarkMode={setDarkMode}>
          <Routes>
            <Route path="/" element={<Navigate to="/login" />} />
            <Route
              path="/login"
              element={<Login darkMode={darkMode} setDarkMode={setDarkMode} />}
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
    </AuthProvider>
  );
};

export default App;
