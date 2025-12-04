import React, { useEffect, useState, useRef } from "react";
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

// --- ARIA Live Region State ---
// This component manages the state that will be announced globally
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
  // 1. Give the column container a semantic role of 'region' or 'list'
  return (
    <Box sx={{ width: 350, mx: 2 }} role="region" aria-labelledby={`column-heading-${title}`}>
      <Paper
        sx={{
          backgroundColor: color,
          p: 2,
          borderRadius: "8px 8px 0 0",
          mb: 0,
        }}
      >
        {/* 2. Add an ID for ARIA linking */}
        <Typography 
          id={`column-heading-${title}`}
          sx={{ 
            color: "white", 
            textAlign: "center",
            fontSize: "1.1rem",
            fontWeight: "500"
          }}
        >
          {title} tasks ({tasks.length})
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
          // 3. Announce empty state
          <Typography 
            sx={{ textAlign: "center", color: "text.secondary", py: 2 }}
            aria-live="polite"
          >
            No tasks in the {title} column.
          </Typography>
        ) : (
          // 4. Use role="list" and role="listitem" for task grouping
          <Box role="list">
            {tasks.map((task) => (
              <Box key={task.id} role="listitem">
                <TaskCard task={task} {...taskHandlers} />
              </Box>
            ))}
          </Box>
        )}
      </Paper>
    </Box>
  );
};

// Main TaskList Component
const TaskList = () => {
  const [tasks, setTasks] = useState([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [currentTask, setCurrentTask] = useState(null);
  const [liveMessage, setLiveMessage] = useState("Task list loaded."); // Initialize ARIA message
  
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
        setLiveMessage(`Task: "${taskToDelete.title}" archived successfully.`); // 5. Announce deletion/archive
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
        setLiveMessage(`Task: "${taskToUpdate.title}" status updated to ${newStatus}.`); // 5. Announce status change
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
    setLiveMessage(`Opening sub-task manager for task: ${task.title}.`); // 5. Announce drawer opening
  };
  
  const handleDrawerClose = () => {
    setDrawerOpen(false);
    setCurrentTask(null);
    setLiveMessage("Sub-task manager closed."); // 5. Announce drawer closing
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
    <Box sx={{ p: 3 }}>
      {/* 6. Include the ARIA Live Region for global announcements */}
      <AriaLiveRegion message={liveMessage} />
      
      <Typography
        variant="h4"
        component="h1" // 7. Use semantic heading tag
        sx={{ mb: 4, textAlign: "center", fontWeight: "500" }}
      >
        Your Tasks
      </Typography>
      
      {/* 8. Use role="group" or "listbox" for the Kanban board container, making it a cohesive unit */}
      <Box 
        role="group" 
        aria-label="Task Kanban Board organized by status"
        sx={{ 
          display: "flex",
          justifyContent: "center",
          gap: 2,
          width: "100%",
          overflowX: "auto",
          pb: 2,
        }}
      >
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
        onClose={handleDrawerClose}
        task={currentTask}
      />
    </Box>
  );
};

export default TaskList;