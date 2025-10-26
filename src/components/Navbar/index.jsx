import React, { useState } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Switch,
  Box,
  Button,
  Drawer,
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
import Brightness4Icon from "@mui/icons-material/Brightness4";
import Brightness7Icon from "@mui/icons-material/Brightness7";
import { MdDarkMode } from "react-icons/md";
import { MdLightMode } from "react-icons/md";

export default function Navbar({ darkMode, setDarkMode }) {
  const location = useLocation();
  const theme = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleDrawer = () => setMobileOpen(!mobileOpen);

  const pages = [
    { title: "O‘quvchilar", path: "/", icon: <SchoolIcon /> },
    { title: "Davomat", path: "/davomat", icon: <AccessTimeIcon /> },
    { title: "Tarix", path: "/tarix", icon: <HistoryIcon /> },
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

  return (
    <>
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          bgcolor: theme.palette.mode === "dark" ? "#121212" : "#ffffff",
          color: theme.palette.mode === "dark" ? "#fff" : "#000",
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Toolbar sx={{ justifyContent: "space-between" }}>
          {/* Chap tomonda — Logo + Burger */}
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

          {/* Markazda — navigatsiya tugmalari */}
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

          {/* O‘ng tomonda — dark mode tugmasi */}
          <Box display="flex" alignItems="center" gap={1}>
            <IconButton
              onClick={() => setDarkMode((prev) => !prev)}
              color="inherit"
            >
              {darkMode ? <MdLightMode /> : <MdDarkMode />}
            </IconButton>
            {/* <Switch
              checked={darkMode}
              onChange={() => setDarkMode((prev) => !prev)}
              color="default"
            /> */}
          </Box>
        </Toolbar>
      </AppBar>

      {/* Mobil menyu */}
      <Drawer
        anchor="left"
        open={mobileOpen}
        onClose={toggleDrawer}
        sx={{
          "& .MuiDrawer-paper": {
            bgcolor: theme.palette.background.paper,
          },
        }}
      >
        {drawer}
      </Drawer>
    </>
  );
}
