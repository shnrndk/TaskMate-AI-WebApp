import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Header from "./components/Header";
// index.js or App.jsx (top of file)
import "react-big-calendar/lib/css/react-big-calendar.css";
import AppRoutes from "./Routes";

const App = () => {
  return (
    <Router>
      <Header />
      <AppRoutes />
    </Router>
  );
};

export default App;
