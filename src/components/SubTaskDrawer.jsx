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
  CircularProgress, // Import CircularProgress for better loading indication
  InputLabel, // Import InputLabel for accessible Select
  FormControl, // Import FormControl to group InputLabel and Select
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
  
  // 🔹 NEW: ARIA Live Region State
  const [liveMessage, setLiveMessage] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    if (task) {
      fetchSubTasks();
      setGeneratedSubTasks([]); // reset generated list when switching tasks
      // 🔹 A11y: Announce when the drawer opens for a new task
      setLiveMessage(`Sub-Task panel opened for task: ${task.title}`);
    }
  }, [task]);

  const fetchSubTasks = async () => {
    const response = await fetchWithAuth(`/api/tasks/${task.id}/sub-tasks`);
    if (response.ok) {
      const data = await response.json();
      setSubTasks(data);
      // 🔹 A11y: Announce successful fetch if the list changes significantly
      // (This is often too verbose, so we'll rely on the action handlers to announce)
    } else {
      setLiveMessage("Failed to fetch sub-tasks.");
      // alert("Failed to fetch sub-tasks."); // Keeping silent alert for accessibility
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
      setLiveMessage(`Sub-task "${newSubTask.title}" added successfully.`); // 🔹 A11y
    } else {
      setLiveMessage("Failed to add sub-task."); // 🔹 A11y
      // alert("Failed to add sub-task.");
    }
  };

  const handleDeleteSubTask = async (id) => {
    const subTaskToDelete = subTasks.find(st => st.id === id);
    const response = await fetchWithAuth(`/api/tasks/${task.id}/sub-tasks/${id}`, {
      method: "DELETE",
    });

    if (response.ok) {
      fetchSubTasks();
      setLiveMessage(`Sub-task "${subTaskToDelete?.title}" deleted.`); // 🔹 A11y
    } else {
      setLiveMessage("Failed to delete sub-task."); // 🔹 A11y
      // alert("Failed to delete sub-task.");
    }
  };

  const handleStartSubTask = async (id) => {
    // 🔹 A11y: Announce navigation/action
    const subTaskToStart = subTasks.find(st => st.id === id);
    setLiveMessage(`Starting Pomodoro timer for sub-task: ${subTaskToStart?.title}`);
    navigate(`/sub-tasks/${id}/timer`);
  };

  const handleStatusChange = async (id, status) => {
    let tempSubTask;
    const updatedSubTasks = subTasks.map((subTask) => {
      if (subTask.id === id) {
        tempSubTask = { ...subTask, status };
        return tempSubTask;
      }
      return subTask;
    });

    const response = await fetchWithAuth(`/api/tasks/sub-tasks/${id}`, {
      method: "PUT",
      body: JSON.stringify({ ...tempSubTask }),
    });

    if (response.ok) {
      setSubTasks(updatedSubTasks); // Optimistic update
      setLiveMessage(`Sub-task "${tempSubTask.title}" status changed to ${status}.`); // 🔹 A11y
    } else {
      setLiveMessage("Failed to update sub-task status."); // 🔹 A11y
      // alert("Failed to update sub-task status.");
      fetchSubTasks(); // Revert on failure
    }
  };

  // 🔹 NEW: call backend LLM to generate suggested sub-tasks
  const handleGenerateSubTasks = async () => {
    if (!task) return;
    setIsGenerating(true);
    setLiveMessage("Generating sub-task suggestions using AI."); // 🔹 A11y
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
        const generated = data.subTasks || [];
        setGeneratedSubTasks(generated);
        if (generated.length > 0) {
          setLiveMessage(`${generated.length} sub-tasks suggested by AI. Review and add.`); // 🔹 A11y
        } else {
          setLiveMessage("AI did not suggest any sub-tasks.");
        }
      } else {
        setLiveMessage("Failed to generate sub-tasks."); // 🔹 A11y
        // alert("Failed to generate sub-tasks.");
      }
    } catch (err) {
      console.error("Error generating sub-tasks:", err);
      setLiveMessage("Error generating sub-tasks."); // 🔹 A11y
      // alert("Error generating sub-tasks.");
    } finally {
      setIsGenerating(false);
    }
  };

  // 🔹 NEW: accept generated sub-tasks and save them via bulk API
  const handleAddGeneratedSubTasks = async () => {
    if (!generatedSubTasks.length) return;
    setIsAddingGenerated(true);
    setLiveMessage(`Adding ${generatedSubTasks.length} generated sub-tasks...`); // 🔹 A11y
    try {
      const response = await fetchWithAuth(
        `/api/tasks/${task.id}/sub-tasks/bulk`,
        {
          method: "POST",
          body: JSON.stringify({ subTasks: generatedSubTasks }),
        }
      );

      if (response.ok) {
        const count = generatedSubTasks.length;
        setGeneratedSubTasks([]);
        fetchSubTasks();
        setLiveMessage(`${count} generated sub-tasks added successfully.`); // 🔹 A11y
      } else {
        setLiveMessage("Failed to add generated sub-tasks."); // 🔹 A11y
        // alert("Failed to add generated sub-tasks.");
      }
    } catch (err) {
      console.error("Error adding generated sub-tasks:", err);
      setLiveMessage("Error adding generated sub-tasks."); // 🔹 A11y
      // alert("Error adding generated sub-tasks.");
    } finally {
      setIsAddingGenerated(false);
    }
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      // 1. Add accessible title to the drawer
      aria-labelledby="sub-task-drawer-title" 
    >
      <Box sx={{ width: 400, p: 3 }}>
        {/* 2. ARIA Live Region for dynamic announcements */}
        <Box 
          aria-live="assertive" 
          sx={{ position: 'absolute', clip: 'rect(0 0 0 0)', width: 1, height: 1, margin: -1, padding: 0, overflow: 'hidden' }}
        >
          {liveMessage}
        </Box>

        {/* 3. Assign an ID for the aria-labelledby property on the Drawer */}
        <Typography variant="h6" gutterBottom id="sub-task-drawer-title">
          Sub-Tasks for: **{task?.title}**
        </Typography>

        {/* Existing sub-task list */}
        <List aria-label={`Current sub-tasks for ${task?.title}`}>
          {subTasks.map((subTask) => (
            <ListItem
              key={subTask.id}
              // 4. Use role="group" or role="listitem" implicitly, but ensure actions are clear
              // 5. Add a focusable element to wrap actions for keyboard navigation
              secondaryAction={
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <IconButton
                    edge="end"
                    color="primary"
                    onClick={() => handleStartSubTask(subTask.id)}
                    // 6. Clear aria-label for icon button
                    aria-label={`Start Pomodoro timer for ${subTask.title}`}
                  >
                    <PlayArrowIcon />
                  </IconButton>
                  <IconButton
                    edge="end"
                    onClick={() => handleDeleteSubTask(subTask.id)}
                    // 6. Clear aria-label for icon button
                    aria-label={`Delete sub-task ${subTask.title}`}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              }
            >
              <ListItemText
                primary={subTask.title}
                secondary={
                  <Box>
                    <Typography component="span" variant="body2" sx={{ mr: 1 }}>
                        Priority: {subTask.priority} | Duration: {subTask.duration} mins
                    </Typography>
                    {/* 7. Wrap Select in FormControl and use InputLabel for accessibility */}
                    <FormControl size="small" sx={{ mt: 1, minWidth: 120 }}>
                      <InputLabel id={`status-label-${subTask.id}`}>Status</InputLabel>
                      <Select
                        labelId={`status-label-${subTask.id}`}
                        id={`status-select-${subTask.id}`}
                        value={subTask.status}
                        onChange={(e) =>
                          handleStatusChange(subTask.id, e.target.value)
                        }
                        label="Status"
                        aria-label={`Change status of sub-task ${subTask.title}`}
                      >
                        <MenuItem value="Pending">Pending</MenuItem>
                        <MenuItem value="In Progress">In Progress</MenuItem>
                        <MenuItem value="Completed">Completed</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>
                }
              />
            </ListItem>
          ))}
        </List>

        <Divider sx={{ my: 2 }} />

        {/* 🔹 NEW: Generate sub-tasks section */}
        <Box sx={{ mb: 3 }} aria-live="polite">
          <Typography variant="subtitle1" gutterBottom>
            AI-Generated Sub-Tasks
          </Typography>
          <Button
            variant="outlined"
            fullWidth
            onClick={handleGenerateSubTasks}
            disabled={isGenerating}
            sx={{ mb: 2 }}
            // 8. Add visual and accessible loading indicator
            aria-busy={isGenerating}
            startIcon={isGenerating ? <CircularProgress size={20} color="inherit" /> : null}
          >
            {isGenerating ? "Generating Suggestions" : "Generate Sub-Tasks"}
          </Button>

          {generatedSubTasks.length > 0 && (
            <>
              <Typography variant="body2" sx={{ my: 1, fontWeight: 'bold' }}>
                Suggested Sub-Tasks ({generatedSubTasks.length})
              </Typography>
              <List dense aria-label="List of AI suggested sub-tasks">
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
                // 8. Add visual and accessible loading indicator
                aria-busy={isAddingGenerated}
                startIcon={isAddingGenerated ? <CircularProgress size={20} color="inherit" /> : null}
              >
                {isAddingGenerated
                  ? "Adding Sub-Tasks"
                  : `Add ${generatedSubTasks.length} Generated Sub-Tasks`}
              </Button>
            </>
          )}
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Manual add sub-task */}
        <Box sx={{ mt: 1 }}>
          <Typography variant="subtitle1" gutterBottom>
            Add New Sub-Task Manually
          </Typography>
          {/* 9. Ensure TextFields have unique, clear labels */}
          <TextField
            fullWidth
            label="Sub-Task Title"
            id="new-sub-task-title"
            value={newSubTask.title}
            onChange={(e) =>
              setNewSubTask((prev) => ({ ...prev, title: e.target.value }))
            }
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Duration (minutes)"
            id="new-sub-task-duration"
            type="number"
            value={newSubTask.duration}
            onChange={(e) =>
              setNewSubTask((prev) => ({ ...prev, duration: e.target.value }))
            }
            sx={{ mb: 2 }}
          />
          {/* 7. Wrap Select in FormControl and use InputLabel for accessibility */}
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel id="new-sub-task-priority-label">Priority</InputLabel>
            <Select
              labelId="new-sub-task-priority-label"
              id="new-sub-task-priority"
              value={newSubTask.priority}
              onChange={(e) =>
                setNewSubTask((prev) => ({ ...prev, priority: e.target.value }))
              }
              label="Priority"
            >
              <MenuItem value="Low">Low</MenuItem>
              <MenuItem value="Medium">Medium</MenuItem>
              <MenuItem value="High">High</MenuItem>
            </Select>
          </FormControl>
          <Button
            startIcon={<AddIcon />}
            variant="contained"
            color="primary"
            onClick={handleAddSubTask}
            aria-label="Add new sub-task to the list"
          >
            Add Sub-Task
          </Button>
        </Box>
      </Box>
    </Drawer>
  );
};

export default SubTaskDrawer;