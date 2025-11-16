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
          sx={{ flexGrow: 1, fontWeight: "bold", display: "flex", alignItems: "center" }}
        >
          <Box sx={{ mr: 1 }}>📝</Box> TaskMate
        </Typography>

        {/* Navigation Buttons */}


        {isSignedIn ? (
          <>
            <Button
              color="inherit"
              component={Link}
              to="/"
              startIcon={<HomeIcon />}
              sx={{ textTransform: "none" }}
            >
              Home
            </Button>
            <Button
              color="inherit"
              component={Link}
              to="/calendar"
              startIcon={<CalendarMonthIcon />}
              sx={{ textTransform: "none" }}
            >
              Calendar
            </Button>
            <Button
              color="inherit"
              component={Link}
              to="/stats"
              startIcon={<BarChartIcon />}
              sx={{ textTransform: "none" }}
            >
              Stats
            </Button>
            <Button
              color="inherit"
              onClick={handleLogout}
              startIcon={<LogoutIcon />}
              sx={{ textTransform: "none" }}
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
            >
              Login
            </Button>

            <Button
              color="inherit"
              component={Link}
              to="/register"
              startIcon={<PersonAddIcon />}
              sx={{ textTransform: "none" }}
            >
              Register
            </Button>
          </>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Header;
