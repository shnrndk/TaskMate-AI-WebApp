import React, { useContext } from "react";
import { AppBar, Toolbar, Typography, Button, Box, useTheme, Container, IconButton, Tooltip } from "@mui/material";
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import { Link, useNavigate } from "react-router-dom";
import HomeIcon from "@mui/icons-material/Home";
import BarChartIcon from "@mui/icons-material/BarChart";
import LoginIcon from "@mui/icons-material/Login";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import LogoutIcon from "@mui/icons-material/Logout";
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import ColorModeContext from "../context/ColorModeContext";

const Header = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const colorMode = useContext(ColorModeContext);

  // Check if the user is signed in by checking for a token
  const isSignedIn = !!localStorage.getItem("token");

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <AppBar
      position="sticky"
      className="glass-header"
      elevation={0}
      sx={{
        // Background handled by theme overrides, but fallback provided
        bgcolor: 'background.paper',
      }}
    >
      <Container maxWidth="xl">
        <Toolbar disableGutters>
          {/* App Title */}
          <Typography
            variant="h5"
            component={Link}
            to="/"
            role="heading"
            aria-level="1"
            sx={{
              flexGrow: 1,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              color: 'primary.main', // Use themed primary color
              textDecoration: 'none',
              letterSpacing: '0.5px'
            }}
          >
            <Box component="span" sx={{ mr: 1.5, fontSize: '1.8rem' }} aria-hidden="true">⚡</Box>
            TaskMate
          </Typography>

          {/* Navigation Buttons */}
          <Box component="nav" aria-label="Main Navigation" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* Theme Toggle */}
            <Tooltip title={`Switch to ${theme.palette.mode === 'dark' ? 'Light' : 'Dark'} Mode`}>
              <IconButton
                onClick={colorMode.toggleColorMode}
                color="inherit"
                sx={{ ml: 1, mr: 1 }}
              >
                {theme.palette.mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
              </IconButton>
            </Tooltip>

            {isSignedIn ? (
              <>
                <Button
                  color="inherit"
                  component={Link}
                  to="/"
                  startIcon={<HomeIcon />}
                  aria-label="Go to Home page"
                >
                  Home
                </Button>
                <Button
                  color="inherit"
                  component={Link}
                  to="/calendar"
                  startIcon={<CalendarMonthIcon />}
                  aria-label="Go to Calendar view"
                >
                  Calendar
                </Button>
                <Button
                  color="inherit"
                  component={Link}
                  to="/stats"
                  startIcon={<BarChartIcon />}
                  aria-label="View user statistics"
                >
                  Stats
                </Button>
                <Button
                  color="error"
                  variant="outlined"
                  onClick={handleLogout}
                  startIcon={<LogoutIcon />}
                  aria-label="Log out of the application"
                  sx={{ borderColor: 'rgba(255,255,255,0.2)', '&:hover': { borderColor: theme.palette.error.main, backgroundColor: 'rgba(211, 47, 47, 0.1)' } }}
                >
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Button
                  color="inherit"
                  component={Link}
                  to="/login"
                  startIcon={<LoginIcon />}
                  aria-label="Go to Login page"
                >
                  Login
                </Button>

                <Button
                  variant="contained"
                  color="primary"
                  component={Link}
                  to="/register"
                  startIcon={<PersonAddIcon />}
                  aria-label="Go to Register new account page"
                >
                  Register
                </Button>
              </>
            )}
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Header;