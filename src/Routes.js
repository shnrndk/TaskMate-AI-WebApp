import React from 'react';
import { Route, Routes } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import PomodoroTimer from './components/PomodoroTimer';
import PomodoroTimerForSubTasks from './components/PomodoroTimerForSubTasks';
import ProductivityHeatmap from './components/ProductivityHeatMap';
import ProtectedRoute from './components/ProtectedRoute';

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/tasks/:id/timer"
        element={<ProtectedRoute><PomodoroTimer /></ProtectedRoute>}
      />
      <Route
        path="/stats"
        element={<ProtectedRoute><ProductivityHeatmap /></ProtectedRoute>}
      />
      <Route
        path="/sub-tasks/:id/timer"
        element={<ProtectedRoute><PomodoroTimerForSubTasks /></ProtectedRoute>}
      />
    </Routes>
  );
};

export default AppRoutes;
