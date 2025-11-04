import React, { useState, useEffect } from "react";
import {
  AppBar,
  Toolbar,
  IconButton,
  Box,
  Button,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  Drawer,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  useTheme,
} from "@mui/material";
import { Link, useNavigate, useLocation } from "react-router-dom";
import MenuIcon from "@mui/icons-material/Menu";
import SchoolIcon from "@mui/icons-material/School";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import HistoryIcon from "@mui/icons-material/History";
import { MdDarkMode, MdLightMode } from "react-icons/md";
import SaveIcon from "@mui/icons-material/Save";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import LogoutIcon from "@mui/icons-material/Logout";
import PersonIcon from "@mui/icons-material/Person";
import * as XLSX from "xlsx";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../supabaseClient";

export default function Navbar({ darkMode, setDarkMode }) {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, userAvatar } = useAuth();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const toggleDrawer = () => setMobileOpen(!mobileOpen);
  const handleMenuOpen = (e) => setAnchorEl(e.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  const pages = [
    { title: "O‘quvchilar", path: "/lists", icon: <SchoolIcon /> },
    { title: "Davomat", path: "/davomat", icon: <AccessTimeIcon /> },
    { title: "Tarix", path: "/datestatus", icon: <HistoryIcon /> },
  ];

  const drawer = (
    <Box sx={{ width: 240 }} onClick={toggleDrawer}>
      <Typography
        variant="h6"
        fontWeight="bold"
        sx={{
          textAlign: "center",
          py: 2,
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        Milliy
      </Typography>
      <List>
        {pages.map((p) => (
          <ListItem key={p.path} disablePadding>
            <ListItemButton
              component={Link}
              to={p.path}
              selected={location.pathname === p.path}
            >
              <ListItemIcon>{p.icon}</ListItemIcon>
              <ListItemText primary={p.title} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );

  useEffect(() => {
    const savedMode = JSON.parse(localStorage.getItem("darkMode"));
    if (savedMode !== null) setDarkMode(savedMode);
  }, [setDarkMode]);

  const handleSave = () => {
    localStorage.setItem("darkMode", JSON.stringify(darkMode));
    alert("Sozlamalar saqlandi!");
  };

  const handleExportExcel = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("lists")
      .select("fullName, phoneNumber, group, weekDays")
      .eq("user_id", user.id)
      .order("group", { ascending: true })
      .order("id", { ascending: true });

    if (error) {
      alert("Excelga export qilishda xatolik!");
      return;
    }

    const exportData = data.map((r, index) => ({
      "№": index + 1,
      "Ism Familiya": r.fullName,
      Telefon: r.phoneNumber,
      Guruh: r.group,
      "Hafta kunlari": Array.isArray(r.weekDays)
        ? r.weekDays.join(", ")
        : r.weekDays,
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    ws["!cols"] = [
      { wch: 5 },
      { wch: 20 },
      { wch: 15 },
      { wch: 10 },
      { wch: 30 },
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Oquvchilar");
    XLSX.writeFile(wb, "Oquvchilar.xlsx");
  };

  const handleLogout = async () => {
    if (logout) await logout();
    navigate("/login");
  };

  return (
    <>
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          bgcolor: theme.palette.mode === "dark" ? "#121212" : "#fff",
          color: theme.palette.mode === "dark" ? "#fff" : "#000",
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Toolbar sx={{ justifyContent: "space-between" }}>
          <Box display="flex" alignItems="center" gap={1}>
            <IconButton
              sx={{ display: { xs: "block", sm: "none" } }}
              onClick={toggleDrawer}
            >
              <MenuIcon />
            </IconButton>
            <Typography
              variant="h6"
              fontWeight="bold"
              sx={{ display: { xs: "none", sm: "block" } }}
            >
              Milliy
            </Typography>
          </Box>

          <Box sx={{ display: { xs: "none", sm: "flex" }, gap: 1 }}>
            {pages.map((p) => (
              <Button
                key={p.path}
                component={Link}
                to={p.path}
                startIcon={p.icon}
                color={location.pathname === p.path ? "primary" : "inherit"}
                variant={location.pathname === p.path ? "outlined" : "text"}
                sx={{
                  textTransform: "none",
                  fontWeight: location.pathname === p.path ? "bold" : "normal",
                }}
              >
                {p.title}
              </Button>
            ))}
          </Box>

          <Box display="flex" alignItems="center" gap={1}>
            <IconButton onClick={() => setDarkMode((prev) => !prev)}>
              {darkMode ? <MdLightMode /> : <MdDarkMode />}
            </IconButton>

            {user && (
              <Box>
                <IconButton onClick={handleMenuOpen} size="small">
                  <Avatar sx={{ width: 32, height: 32 }} src={userAvatar || ""}>
                    {!userAvatar && user.email.charAt(0).toUpperCase()}
                  </Avatar>
                </IconButton>

                <Menu
                  anchorEl={anchorEl}
                  open={open}
                  onClose={handleMenuClose}
                  anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                  transformOrigin={{ vertical: "top", horizontal: "right" }}
                  PaperProps={{ sx: { minWidth: 180 } }}
                >
                  <MenuItem
                    onClick={() => {
                      navigate("/profile");
                      handleMenuClose();
                    }}
                  >
                    <PersonIcon sx={{ mr: 1 }} /> Profile
                  </MenuItem>
                  <MenuItem
                    onClick={() => {
                      handleSave();
                      handleMenuClose();
                    }}
                  >
                    <SaveIcon sx={{ mr: 1 }} /> Saqlash
                  </MenuItem>
                  <MenuItem
                    onClick={() => {
                      handleExportExcel();
                      handleMenuClose();
                    }}
                  >
                    <FileDownloadIcon sx={{ mr: 1 }} /> Excelga export
                  </MenuItem>
                  <Divider />
                  <MenuItem
                    onClick={() => {
                      handleLogout();
                      handleMenuClose();
                    }}
                  >
                    <LogoutIcon sx={{ mr: 1 }} /> Logout
                  </MenuItem>
                </Menu>
              </Box>
            )}
          </Box>
        </Toolbar>
      </AppBar>

      <Drawer
        anchor="left"
        open={mobileOpen}
        onClose={toggleDrawer}
        sx={{
          "& .MuiDrawer-paper": { bgcolor: theme.palette.background.paper },
        }}
      >
        {drawer}
      </Drawer>
    </>
  );
}
