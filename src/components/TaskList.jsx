import React, { useEffect, useState } from "react";
import TaskItem from "./TaskItem";
import SubTaskDrawer from "./SubTaskDrawer";
import { fetchWithAuth } from "../utils/api";
import { Paper, Typography, Box, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";

const TaskList = () => {
  const [tasks, setTasks] = useState([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [currentTask, setCurrentTask] = useState(null);
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
    let tempTask;
    tasks.map((task) => (task.id === id ? (tempTask = task) : null));
    const response = await fetchWithAuth(`/api/tasks/${id}`, {
      method: "PUT",
      body: JSON.stringify({ ...tempTask, status: newStatus }),
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

  const handleSubTasking = (task) => {
    setCurrentTask(task);
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setCurrentTask(null);
  };

  return (
    <Box sx={{ maxWidth: 800, mx: "auto", mt: 4 }}>
      <Typography variant="h5" align="center" gutterBottom>
        Your Tasks
      </Typography>
      <Paper sx={{ p: 2 }}>
        {tasks.length > 0 ? (
          tasks.map((task) => (
            <Box
              key={task.id}
              sx={{ mb: 2, p: 2, border: "1px solid #ddd", borderRadius: 2 }}
            >
              <TaskItem
                task={task}
                onDelete={handleDelete}
                onStatusChange={handleStatusChange}
                onNavigate={() => navigate(`/tasks/${task.id}/timer`)}
              />
              <Button
                variant="outlined"
                color="primary"
                sx={{ mt: 1 }}
                onClick={() => handleSubTasking(task)}
              >
                Manage Sub-Tasks
              </Button>
            </Box>
          ))
        ) : (
          <Typography align="center">No tasks available.</Typography>
        )}
      </Paper>
      <SubTaskDrawer
        open={drawerOpen}
        onClose={closeDrawer}
        task={currentTask}
      />
    </Box>
  );
};

export default TaskList;
