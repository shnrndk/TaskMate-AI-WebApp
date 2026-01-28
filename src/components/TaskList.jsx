import React, { useEffect, useState } from "react";
import { Typography, Box, Container } from "@mui/material"; // Added Container
import { useNavigate } from "react-router-dom";
import { fetchWithAuth } from "../utils/api";
import SubTaskDrawer from "./SubTaskDrawer";
import TaskCard from "./TaskItem";

const STATUSES = {
  PENDING: "Pending",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed"
};

// --- ARIA Live Region State ---
const AriaLiveRegion = ({ message }) => (
  <Box
    aria-live="assertive"
    sx={{ position: 'absolute', clip: 'rect(0 0 0 0)', width: 1, height: 1, margin: -1, padding: 0, overflow: 'hidden' }}
  >
    {message}
  </Box>
);

// Kanban Column Component
const KanbanColumn = ({ title, tasks, color, ...taskHandlers }) => {
  return (
    <Box
      sx={{
        flex: 1,
        minWidth: 300,
        maxWidth: 400
      }}
      role="region"
      aria-labelledby={`column-heading-${title}`}
    >
      <Box
        sx={{
          p: 2,
          borderBottom: `2px solid ${color}`,
          mb: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <Typography
          id={`column-heading-${title}`}
          variant="h6"
          sx={{
            fontWeight: "700",
            color: 'text.primary',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            fontSize: '0.9rem'
          }}
        >
          {title}
        </Typography>
        <Box sx={{
          bgcolor: color,
          color: 'white',
          borderRadius: '50%',
          width: 28,
          height: 28,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '0.8rem',
          fontWeight: 'bold'
        }}>
          {tasks.length}
        </Box>
      </Box>

      <Box
        className="glass-container"
        sx={{
          p: 2,
          minHeight: 200,
          borderRadius: 3,
          overflowY: "auto",
          maxHeight: "calc(100vh - 300px)",
        }}
      >
        {tasks.length === 0 ? (
          <Typography
            sx={{ textAlign: "center", color: "text.secondary", py: 4, fontStyle: 'italic' }}
            aria-live="polite"
          >
            No tasks yet.
          </Typography>
        ) : (
          <Box role="list" sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {tasks.map((task) => (
              <Box key={task.id} role="listitem">
                <TaskCard task={task} {...taskHandlers} />
              </Box>
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
};

// Main TaskList Component
const TaskList = () => {
  const [tasks, setTasks] = useState([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [currentTask, setCurrentTask] = useState(null);
  const [liveMessage, setLiveMessage] = useState("Task list loaded.");

  const navigate = useNavigate();

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const response = await fetchWithAuth("/api/tasks");
        if (response.ok) {
          const data = await response.json();
          setTasks(data);
          setLiveMessage("Tasks loaded successfully.");
        } else {
          setLiveMessage("Failed to fetch tasks.");
        }
      } catch (error) {
        setLiveMessage("Error loading tasks.");
      }
    };
    fetchTasks();
  }, []);

  const handleDelete = async (id) => {
    try {
      const taskToDelete = tasks.find(task => task.id === id);
      const response = await fetchWithAuth(`/api/tasks/${id}/archive`, {
        method: "PUT",
      });
      if (response.ok) {
        setTasks(prevTasks => prevTasks.filter(task => task.id !== id));
        setLiveMessage(`Task: "${taskToDelete.title}" archived successfully.`);
      } else {
        setLiveMessage(`Failed to archive task: "${taskToDelete.title}".`);
      }
    } catch (error) {
      console.error("Error archive task:", error);
      setLiveMessage("An error occurred while attempting to archive the task.");
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
        setLiveMessage(`Task: "${taskToUpdate.title}" status updated to ${newStatus}.`);
      } else {
        setLiveMessage(`Failed to update status for task: "${taskToUpdate.title}".`);
      }
    } catch (error) {
      console.error("Error updating task status:", error);
      setLiveMessage("An error occurred while attempting to update the task status.");
    }
  };

  const handleSubTasking = (task) => {
    setCurrentTask(task);
    setDrawerOpen(true);
    setLiveMessage(`Opening sub-task manager for task: ${task.title}.`);
  };

  const handleDrawerClose = () => {
    setDrawerOpen(false);
    setCurrentTask(null);
    setLiveMessage("Sub-task manager closed.");
  };


  const getTasksByStatus = (status) => {
    return tasks.filter(task => task.status === status);
  };

  const taskHandlers = {
    onDelete: handleDelete,
    onStatusChange: handleStatusChange,
    onNavigate: (taskId) => {
      const taskToNavigate = tasks.find(task => task.id === taskId);
      setLiveMessage(`Navigating to Pomodoro timer for task: ${taskToNavigate.title}.`);
      navigate(`/tasks/${taskId}/timer`);
    },
    handleSubTasking: handleSubTasking,
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <AriaLiveRegion message={liveMessage} />

      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography variant="h3" component="h1" gutterBottom fontWeight="700" sx={{ background: 'linear-gradient(45deg, #E94560, #FF6B6B)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          My Workspace
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Manage your tasks efficiently
        </Typography>
      </Box>

      <Box
        role="group"
        aria-label="Task Kanban Board organized by status"
        sx={{
          display: "flex",
          justifyContent: "space-between",
          gap: 3,
          overflowX: "auto",
          pb: 2,
        }}
      >
        <KanbanColumn
          title={STATUSES.PENDING}
          tasks={getTasksByStatus(STATUSES.PENDING)}
          color="#FF9F43" // Orange
          {...taskHandlers}
        />
        <KanbanColumn
          title={STATUSES.IN_PROGRESS}
          tasks={getTasksByStatus(STATUSES.IN_PROGRESS)}
          color="#54A0FF" // Blue
          {...taskHandlers}
        />
        <KanbanColumn
          title={STATUSES.COMPLETED}
          tasks={getTasksByStatus(STATUSES.COMPLETED)}
          color="#1DD1A1" // Green
          {...taskHandlers}
        />
      </Box>

      <SubTaskDrawer
        open={drawerOpen}
        onClose={handleDrawerClose}
        task={currentTask}
      />
    </Container>
  );
};

export default TaskList;