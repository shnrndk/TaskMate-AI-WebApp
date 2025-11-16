import React, { useState, useEffect } from "react";
import {
  Drawer,
  Box,
  Typography,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Select,
  MenuItem,
  Divider,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import { fetchWithAuth } from "../utils/api";
import { useNavigate } from "react-router-dom";

const SubTaskDrawer = ({ open, onClose, task }) => {
  const [subTasks, setSubTasks] = useState([]);
  const [newSubTask, setNewSubTask] = useState({
    title: "",
    priority: "Medium",
    duration: "",
  });

  // 🔹 NEW: state for LLM-generated sub-tasks
  const [generatedSubTasks, setGeneratedSubTasks] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAddingGenerated, setIsAddingGenerated] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    if (task) {
      fetchSubTasks();
      setGeneratedSubTasks([]); // reset generated list when switching tasks
    }
  }, [task]);

  const fetchSubTasks = async () => {
    const response = await fetchWithAuth(`/api/tasks/${task.id}/sub-tasks`);
    if (response.ok) {
      const data = await response.json();
      setSubTasks(data);
    } else {
      alert("Failed to fetch sub-tasks.");
    }
  };

  const handleAddSubTask = async () => {
    if (!newSubTask.title.trim()) {
      alert("Sub-task title cannot be empty.");
      return;
    }
    const response = await fetchWithAuth(`/api/tasks/${task.id}/sub-tasks`, {
      method: "POST",
      body: JSON.stringify(newSubTask),
    });
    if (response.ok) {
      setNewSubTask({ title: "", priority: "Medium", duration: "" });
      fetchSubTasks();
    } else {
      alert("Failed to add sub-task.");
    }
  };

  const handleDeleteSubTask = async (id) => {
    const response = await fetchWithAuth(`/api/tasks/${task.id}/sub-tasks/${id}`, {
      method: "DELETE",
    });

    if (response.ok) {
      fetchSubTasks();
    } else {
      alert("Failed to delete sub-task.");
    }
  };

  const handleStartSubTask = async (id) => {
    navigate(`/sub-tasks/${id}/timer`);
  };

  const handleStatusChange = async (id, status) => {
    let tempSubTask;
    subTasks.map((subTask) => {
      if (subTask.id === id) {
        tempSubTask = { ...subTask, status };
      }
      return subTask;
    });

    const response = await fetchWithAuth(`/api/tasks/sub-tasks/${id}`, {
      method: "PUT",
      body: JSON.stringify({ ...tempSubTask }),
    });

    if (response.ok) {
      fetchSubTasks();
    } else {
      alert("Failed to update sub-task status.");
    }
  };

  // 🔹 NEW: call backend LLM to generate suggested sub-tasks
  const handleGenerateSubTasks = async () => {
    if (!task) return;
    setIsGenerating(true);
    try {
      const response = await fetchWithAuth(
        `/api/tasks/${task.id}/sub-tasks/generate`,
        {
          method: "POST",
          body: JSON.stringify({
            title: task.title,
            description: task.description,
            category: task.category,
            duration: task.duration,
            priority: task.priority,
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        // Expecting { subTasks: [{ title, duration, priority }, ...] }
        setGeneratedSubTasks(data.subTasks || []);
      } else {
        alert("Failed to generate sub-tasks.");
      }
    } catch (err) {
      console.error("Error generating sub-tasks:", err);
      alert("Error generating sub-tasks.");
    } finally {
      setIsGenerating(false);
    }
  };

  // 🔹 NEW: accept generated sub-tasks and save them via bulk API
  const handleAddGeneratedSubTasks = async () => {
    if (!generatedSubTasks.length) return;
    setIsAddingGenerated(true);
    try {
      const response = await fetchWithAuth(
        `/api/tasks/${task.id}/sub-tasks/bulk`,
        {
          method: "POST",
          body: JSON.stringify({ subTasks: generatedSubTasks }),
        }
      );

      if (response.ok) {
        setGeneratedSubTasks([]);
        fetchSubTasks();
      } else {
        alert("Failed to add generated sub-tasks.");
      }
    } catch (err) {
      console.error("Error adding generated sub-tasks:", err);
      alert("Error adding generated sub-tasks.");
    } finally {
      setIsAddingGenerated(false);
    }
  };

  return (
    <Drawer anchor="right" open={open} onClose={onClose}>
      <Box sx={{ width: 400, p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Sub-Tasks for: {task?.title}
        </Typography>

        {/* Existing sub-task list */}
        <List>
          {subTasks.map((subTask) => (
            <ListItem
              key={subTask.id}
              secondaryAction={
                <>
                  <IconButton
                    edge="end"
                    aria-label="start"
                    color="primary"
                    onClick={() => handleStartSubTask(subTask.id)}
                  >
                    <PlayArrowIcon />
                  </IconButton>
                  <IconButton
                    edge="end"
                    aria-label="delete"
                    onClick={() => handleDeleteSubTask(subTask.id)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </>
              }
            >
              <ListItemText
                primary={subTask.title}
                secondary={
                  <>
                    Priority: {subTask.priority} | Duration: {subTask.duration} mins
                    <Box>
                      <Select
                        value={subTask.status}
                        onChange={(e) =>
                          handleStatusChange(subTask.id, e.target.value)
                        }
                        size="small"
                        sx={{ mt: 1 }}
                      >
                        <MenuItem value="Pending">Pending</MenuItem>
                        <MenuItem value="In Progress">In Progress</MenuItem>
                        <MenuItem value="Completed">Completed</MenuItem>
                      </Select>
                    </Box>
                  </>
                }
              />
            </ListItem>
          ))}
        </List>

        <Divider sx={{ my: 2 }} />

        {/* 🔹 NEW: Generate sub-tasks section */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            AI-Generated Sub-Tasks
          </Typography>
          <Button
            variant="outlined"
            fullWidth
            onClick={handleGenerateSubTasks}
            disabled={isGenerating}
            sx={{ mb: 2 }}
          >
            {isGenerating ? "Generating..." : "Generate Sub-Tasks"}
          </Button>

          {generatedSubTasks.length > 0 && (
            <>
              <List dense>
                {generatedSubTasks.map((st, idx) => (
                  <ListItem key={idx}>
                    <ListItemText
                      primary={st.title}
                      secondary={`Priority: ${st.priority} | Duration: ${st.duration} mins`}
                    />
                  </ListItem>
                ))}
              </List>
              <Button
                variant="contained"
                color="secondary"
                fullWidth
                onClick={handleAddGeneratedSubTasks}
                disabled={isAddingGenerated}
              >
                {isAddingGenerated
                  ? "Adding Sub-Tasks..."
                  : "Add Generated Sub-Tasks"}
              </Button>
            </>
          )}
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Manual add sub-task */}
        <Box sx={{ mt: 1 }}>
          <Typography variant="subtitle1" gutterBottom>
            Add New Sub-Task
          </Typography>
          <TextField
            fullWidth
            label="Title"
            value={newSubTask.title}
            onChange={(e) =>
              setNewSubTask((prev) => ({ ...prev, title: e.target.value }))
            }
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Duration (mins)"
            type="number"
            value={newSubTask.duration}
            onChange={(e) =>
              setNewSubTask((prev) => ({ ...prev, duration: e.target.value }))
            }
            sx={{ mb: 2 }}
          />
          <Select
            fullWidth
            value={newSubTask.priority}
            onChange={(e) =>
              setNewSubTask((prev) => ({ ...prev, priority: e.target.value }))
            }
            sx={{ mb: 2 }}
          >
            <MenuItem value="Low">Low</MenuItem>
            <MenuItem value="Medium">Medium</MenuItem>
            <MenuItem value="High">High</MenuItem>
          </Select>
          <Button
            startIcon={<AddIcon />}
            variant="contained"
            color="primary"
            onClick={handleAddSubTask}
          >
            Add Sub-Task
          </Button>
        </Box>
      </Box>
    </Drawer>
  );
};

export default SubTaskDrawer;
