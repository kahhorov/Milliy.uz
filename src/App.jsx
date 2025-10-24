import React, { useState } from "react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import Lists from "./components/Lists";
import { Tabs, Tab, Box } from "@mui/material";
import Davomat from "./components/Davomat";
import DateStatus from "./components/DateStatus";

export default function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [tab, setTab] = useState(0);

  const theme = createTheme({
    palette: { mode: darkMode ? "dark" : "light" },
  });

  return (
    <ThemeProvider theme={theme}>
      <Box>
        <Tabs
          value={tab}
          onChange={(e, v) => setTab(v)}
          centered
          sx={{ mb: 2 }}
        >
          <Tab label="📋 O‘quvchilar" />
          <Tab label="🕒 Davomat" />
          <Tab label="🕒 Davomat Tarixi" />
        </Tabs>

        {tab === 0 && <Lists darkMode={darkMode} setDarkMode={setDarkMode} />}
        {tab === 1 && <Davomat darkMode={darkMode} setDarkMode={setDarkMode} />}
        {tab === 2 && (
          <DateStatus darkMode={darkMode} setDarkMode={setDarkMode} />
        )}
      </Box>
    </ThemeProvider>
  );
}
