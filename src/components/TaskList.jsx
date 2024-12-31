import React, { useEffect, useState } from "react";
import TaskItem from "./TaskItem";
import { fetchWithAuth } from "../utils/api";
import { Paper, Typography, Box } from "@mui/material";
import { useNavigate } from "react-router-dom";

const TaskList = () => {
  const [tasks, setTasks] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTasks = async () => {
      const response = await fetchWithAuth("/api/tasks");
      if (response.ok) {
        const data = await response.json();
        setTasks(data);
      } else {
        alert("Failed to fetch tasks.");
      }
    };

    fetchTasks();
  }, []);

  const handleDelete = async (id) => {
    const response = await fetchWithAuth(`/api/tasks/${id}`, {
      method: "DELETE",
    });

    if (response.ok) {
      setTasks(tasks.filter((task) => task.id !== id));
    } else {
      alert("Failed to delete the task.");
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    const response = await fetchWithAuth(`/api/tasks/${id}`, {
      method: "PUT",
      body: JSON.stringify({ status: newStatus }),
    });

    if (response.ok) {
      setTasks(
        tasks.map((task) =>
          task.id === id ? { ...task, status: newStatus } : task
        )
      );
    } else {
      alert("Failed to update the task status.");
    }
  };

  const handleStartTask = async (id) => {
    const response = await fetchWithAuth(`/api/tasks/${id}/start`, {
      method: "PUT",
    });

    if (response.ok) {
      navigate(`/tasks/${id}/timer`); // Redirect to the Pomodoro Timer page
    } else {
      alert("Failed to start the task.");
    }
  };

  return (
    <Box sx={{ maxWidth: 800, mx: "auto", mt: 4 }}>
      <Typography variant="h5" align="center" gutterBottom>
        Your Tasks
      </Typography>
      <Paper sx={{ p: 2 }}>
        {tasks.length > 0 ? (
          tasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              onDelete={handleDelete}
              onStatusChange={handleStatusChange}
              onStartTask={handleStartTask}
            />
          ))
        ) : (
          <Typography align="center">No tasks available.</Typography>
        )}
      </Paper>
    </Box>
  );
};

export default TaskList;
