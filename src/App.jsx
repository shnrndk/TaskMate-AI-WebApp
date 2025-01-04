import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Header from "./components/Header";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import PomodoroTimer from "./components/PomodoroTimer";
import PomodoroTimerForSubTasks from "./components/PomodoroTimerForSubTasks";

const App = () => {
  return (
    <Router>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/tasks/:id/timer" element={<PomodoroTimer />} />
        <Route path="/sub-tasks/:id/timer" element={<PomodoroTimerForSubTasks />} />
      </Routes>
    </Router>
  );
};

export default App;
