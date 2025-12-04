import React from "react";
import { AppBar, Toolbar, Typography, Button, IconButton, Box } from "@mui/material";
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import { Link, useNavigate } from "react-router-dom";
import HomeIcon from "@mui/icons-material/Home";
import BarChartIcon from "@mui/icons-material/BarChart";
import LoginIcon from "@mui/icons-material/Login";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import LogoutIcon from "@mui/icons-material/Logout";

const Header = () => {
  const navigate = useNavigate();

  // Check if the user is signed in by checking for a token
  const isSignedIn = !!localStorage.getItem("token");

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <AppBar position="static" sx={{ backgroundColor: "#3f51b5" }}>
      <Toolbar>
        {/* App Title */}
        <Typography
          variant="h6"
          component="div"
          // Adding role="heading" and aria-level="1" for better structure if this is the main app title
          role="heading"
          aria-level="1"
          sx={{ flexGrow: 1, fontWeight: "bold", display: "flex", alignItems: "center" }}
        >
          <Box sx={{ mr: 1 }} aria-hidden="true">📝</Box> TaskMate
        </Typography>

        {/* Navigation Buttons */}
        {/* Wrapping navigation buttons in a <nav> element for better structure */}
        <Box component="nav" aria-label="Main Navigation">
          {isSignedIn ? (
            <>
              <Button
                color="inherit"
                component={Link}
                to="/"
                startIcon={<HomeIcon />}
                sx={{ textTransform: "none" }}
                aria-label="Go to Home page"
              >
                Home
              </Button>
              <Button
                color="inherit"
                component={Link}
                to="/calendar"
                startIcon={<CalendarMonthIcon />}
                sx={{ textTransform: "none" }}
                aria-label="Go to Calendar view"
              >
                Calendar
              </Button>
              <Button
                color="inherit"
                component={Link}
                to="/stats"
                startIcon={<BarChartIcon />}
                sx={{ textTransform: "none" }}
                aria-label="View user statistics"
              >
                Stats
              </Button>
              <Button
                color="inherit"
                onClick={handleLogout}
                startIcon={<LogoutIcon />}
                sx={{ textTransform: "none" }}
                aria-label="Log out of the application"
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
                sx={{ textTransform: "none" }}
                aria-label="Go to Login page"
              >
                Login
              </Button>

              <Button
                color="inherit"
                component={Link}
                to="/register"
                startIcon={<PersonAddIcon />}
                sx={{ textTransform: "none" }}
                aria-label="Go to Register new account page"
              >
                Register
              </Button>
            </>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;