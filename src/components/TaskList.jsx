import React, { useEffect, useState } from "react";
import { Typography, Box, Paper } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { fetchWithAuth } from "../utils/api";
import SubTaskDrawer from "./SubTaskDrawer";
import TaskCard from "./TaskItem";

const STATUSES = {
  PENDING: "Pending",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed"
};

// Kanban Column Component
const KanbanColumn = ({ title, tasks, color, ...taskHandlers }) => (
  <Box sx={{ width: 350, mx: 2 }}>
    <Paper
      sx={{
        backgroundColor: color,
        p: 2,
        borderRadius: "8px 8px 0 0",
        mb: 0,
      }}
    >
      <Typography sx={{ 
        color: "white", 
        textAlign: "center",
        fontSize: "1.1rem",
        fontWeight: "500"
      }}>
        {title} ({tasks.length})
      </Typography>
    </Paper>
    <Paper
      sx={{
        p: 2,
        minHeight: 200,
        backgroundColor: "#f5f5f5",
        borderRadius: "0 0 8px 8px",
        overflowY: "auto",
        maxHeight: "calc(100vh - 250px)",
      }}
    >
      {tasks.length === 0 ? (
        <Typography sx={{ textAlign: "center", color: "text.secondary", py: 2 }}>
          No tasks
        </Typography>
      ) : (
        tasks.map((task) => (
          <TaskCard key={task.id} task={task} {...taskHandlers} />
        ))
      )}
    </Paper>
  </Box>
);

// Main TaskList Component
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
    try {
      const response = await fetchWithAuth(`/api/tasks/${id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        setTasks(prevTasks => prevTasks.filter(task => task.id !== id));
      } else {
        alert("Failed to delete the task.");
      }
    } catch (error) {
      console.error("Error deleting task:", error);
      alert("Failed to delete the task.");
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      const taskToUpdate = tasks.find(task => task.id === id);
      if (!taskToUpdate) return;

      const updatedTask = { ...taskToUpdate, status: newStatus };
      
      const response = await fetchWithAuth(`/api/tasks/${id}`, {
        method: "PUT",
        body: JSON.stringify(updatedTask),
      });

      if (response.ok) {
        setTasks(prevTasks => 
          prevTasks.map(task => task.id === id ? updatedTask : task)
        );
      } else {
        alert("Failed to update the task status.");
      }
    } catch (error) {
      console.error("Error updating task status:", error);
      alert("Failed to update the task status.");
    }
  };

  const handleSubTasking = (task) => {
    setCurrentTask(task);
    setDrawerOpen(true);
  };

  const getTasksByStatus = (status) => {
    return tasks.filter(task => task.status === status);
  };

  const taskHandlers = {
    onDelete: handleDelete,
    onStatusChange: handleStatusChange,
    onNavigate: (taskId) => navigate(`/tasks/${taskId}/timer`),
    handleSubTasking: handleSubTasking,
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography
        variant="h4"
        sx={{ mb: 4, textAlign: "center", fontWeight: "500" }}
      >
        Your Tasks
      </Typography>
      
      <Box sx={{ 
        display: "flex",
        justifyContent: "center",
        gap: 2,
        width: "100%",
        overflowX: "auto",
        pb: 2,
      }}>
        <KanbanColumn
          title={STATUSES.PENDING}
          tasks={getTasksByStatus(STATUSES.PENDING)}
          color="#f4511e"
          {...taskHandlers}
        />
        <KanbanColumn
          title={STATUSES.IN_PROGRESS}
          tasks={getTasksByStatus(STATUSES.IN_PROGRESS)}
          color="#1976d2"
          {...taskHandlers}
        />
        <KanbanColumn
          title={STATUSES.COMPLETED}
          tasks={getTasksByStatus(STATUSES.COMPLETED)}
          color="#2e7d32"
          {...taskHandlers}
        />
      </Box>

      <SubTaskDrawer
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setCurrentTask(null);
        }}
        task={currentTask}
      />
    </Box>
  );
};

export default TaskList;