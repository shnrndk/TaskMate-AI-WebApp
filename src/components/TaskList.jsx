import React, { useEffect, useState } from "react";
import TaskItem from "./TaskItem";
import SubTaskDrawer from "./SubTaskDrawer";
import { fetchWithAuth } from "../utils/api";
import { Grid, Typography, Box, Button, Paper } from "@mui/material";
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
    <Box sx={{ maxWidth: 1200, mx: "auto", mt: 4, p: 2 }}>
      <Typography
        variant="h4"
        align="center"
        gutterBottom
        sx={{ fontWeight: "bold", fontFamily: "'Roboto', sans-serif" }}
      >
        Your Tasks
      </Typography>

      {tasks.length > 0 ? (
        <Grid container spacing={3}>
          {tasks.map((task) => (
            <Grid item xs={12} sm={6} md={4} key={task.id}>
              <Paper
                elevation={4}
                sx={{
                  borderRadius: 3,
                  p: 2,
                  transition: "transform 0.2s ease-in-out",
                  "&:hover": {
                    transform: "scale(1.03)",
                  },
                }}
              >
                <TaskItem
                  task={task}
                  onDelete={handleDelete}
                  onStatusChange={handleStatusChange}
                  onNavigate={() => navigate(`/tasks/${task.id}/timer`)}
                  handleSubTasking={() => handleSubTasking(task)}
                />
              </Paper>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Typography align="center" variant="h6" sx={{ mt: 4 }}>
          No tasks available.
        </Typography>
      )}

      <SubTaskDrawer
        open={drawerOpen}
        onClose={closeDrawer}
        task={currentTask}
      />
    </Box>
  );
};

export default TaskList;
