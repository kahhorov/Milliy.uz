// src/components/Navbar.jsx
import React, { useState } from "react";
import {
  AppBar,
  Toolbar,
  IconButton,
  Box,
  Button,
  Avatar,
  Menu,
  MenuItem,
  Drawer,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  useTheme,
} from "@mui/material";
import { Link, useLocation } from "react-router-dom";
import MenuIcon from "@mui/icons-material/Menu";
import SchoolIcon from "@mui/icons-material/School";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import HistoryIcon from "@mui/icons-material/History";
import { MdDarkMode, MdLightMode } from "react-icons/md";
import SaveIcon from "@mui/icons-material/Save";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import PersonIcon from "@mui/icons-material/Person";
import * as XLSX from "xlsx";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase"; // Firebase import

export default function Navbar({ darkMode, setDarkMode }) {
  const theme = useTheme();
  const location = useLocation();

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

  const handleSave = () => {
    localStorage.setItem("darkMode", JSON.stringify(darkMode));
    alert("Sozlamalar saqlandi!");
  };

  const handleExportExcel = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "lists"));
      const data = querySnapshot.docs.map(doc => doc.data());

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
    } catch (error) {
      console.error(error);
      alert("Excelga yuklashda xatolik!");
    }
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
          zIndex: (theme) => theme.zIndex.drawer + 1 
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

            <Box>
              <IconButton onClick={handleMenuOpen} size="small">
                <Avatar sx={{ width: 32, height: 32, bgcolor: "primary.main" }}>
                  A
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
                <MenuItem disabled>
                  <PersonIcon sx={{ mr: 1 }} /> Admin
                </MenuItem>
                <MenuItem
                  onClick={() => {
                    handleSave();
                    handleMenuClose();
                  }}
                >
                  <SaveIcon sx={{ mr: 1 }} /> Sozlamalarni saqlash
                </MenuItem>
                <MenuItem
                  onClick={() => {
                    handleExportExcel();
                    handleMenuClose();
                  }}
                >
                  <FileDownloadIcon sx={{ mr: 1 }} /> Excelga export
                </MenuItem>
              </Menu>
            </Box>
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