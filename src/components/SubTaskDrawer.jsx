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
  CircularProgress,
  InputLabel,
  FormControl,
  Paper,
  Stack,
  useTheme
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import CloseIcon from '@mui/icons-material/Close';
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { fetchWithAuth } from "../utils/api";
import { useNavigate } from "react-router-dom";

const SubTaskDrawer = ({ open, onClose, task }) => {
  const theme = useTheme();
  const [subTasks, setSubTasks] = useState([]);
  const [newSubTask, setNewSubTask] = useState({
    title: "",
    priority: "Medium",
    duration: "",
  });

  const [generatedSubTasks, setGeneratedSubTasks] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAddingGenerated, setIsAddingGenerated] = useState(false);

  const [liveMessage, setLiveMessage] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    if (task) {
      fetchSubTasks();
      setGeneratedSubTasks([]);
      setLiveMessage(`Sub-Task panel opened for task: ${task.title}`);
    }
  }, [task]);

  const fetchSubTasks = async () => {
    const response = await fetchWithAuth(`/api/tasks/${task.id}/sub-tasks`);
    if (response.ok) {
      const data = await response.json();
      setSubTasks(data);
    } else {
      setLiveMessage("Failed to fetch sub-tasks.");
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
      setLiveMessage(`Sub-task "${newSubTask.title}" added successfully.`);
    } else {
      setLiveMessage("Failed to add sub-task.");
    }
  };

  const handleDeleteSubTask = async (id) => {
    const subTaskToDelete = subTasks.find(st => st.id === id);
    const response = await fetchWithAuth(`/api/tasks/${task.id}/sub-tasks/${id}`, {
      method: "DELETE",
    });

    if (response.ok) {
      fetchSubTasks();
      setLiveMessage(`Sub-task "${subTaskToDelete?.title}" deleted.`);
    } else {
      setLiveMessage("Failed to delete sub-task.");
    }
  };

  const handleStartSubTask = async (id) => {
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
      setSubTasks(updatedSubTasks);
      setLiveMessage(`Sub-task "${tempSubTask.title}" status changed to ${status}.`);
    } else {
      setLiveMessage("Failed to update sub-task status.");
      fetchSubTasks();
    }
  };

  const handleGenerateSubTasks = async () => {
    if (!task) return;
    setIsGenerating(true);
    setLiveMessage("Generating sub-task suggestions using AI.");
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
          setLiveMessage(`${generated.length} sub-tasks suggested by AI. Review and add.`);
        } else {
          setLiveMessage("AI did not suggest any sub-tasks.");
        }
      } else {
        setLiveMessage("Failed to generate sub-tasks.");
      }
    } catch (err) {
      console.error("Error generating sub-tasks:", err);
      setLiveMessage("Error generating sub-tasks.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddGeneratedSubTasks = async () => {
    if (!generatedSubTasks.length) return;
    setIsAddingGenerated(true);
    setLiveMessage(`Adding ${generatedSubTasks.length} generated sub-tasks...`);
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
        setLiveMessage(`${count} generated sub-tasks added successfully.`);
      } else {
        setLiveMessage("Failed to add generated sub-tasks.");
      }
    } catch (err) {
      console.error("Error adding generated sub-tasks:", err);
      setLiveMessage("Error adding generated sub-tasks.");
    } finally {
      setIsAddingGenerated(false);
    }
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      aria-labelledby="sub-task-drawer-title"
      PaperProps={{
        sx: {
          width: { xs: '100%', sm: 450 },
          backdropFilter: 'blur(20px)',
          backgroundColor: theme.palette.mode === 'dark' ? 'rgba(30,30,30,0.9)' : 'rgba(255,255,255,0.9)',
          borderLeft: '1px solid',
          borderColor: 'divider'
        }
      }}
    >
      <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* ARIA Live Region */}
        <Box
          aria-live="assertive"
          sx={{ position: 'absolute', clip: 'rect(0 0 0 0)', width: 1, height: 1, margin: -1, padding: 0, overflow: 'hidden' }}
        >
          {liveMessage}
        </Box>

        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h5" fontWeight="700" id="sub-task-drawer-title">
            Sub-Tasks
          </Typography>
          <IconButton onClick={onClose} aria-label="Close drawer">
            <CloseIcon />
          </IconButton>
        </Stack>
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          Project: {task?.title}
        </Typography>

        <Divider sx={{ my: 2 }} />

        {/* Existing sub-task list */}
        <Box sx={{ flex: 1, overflowY: 'auto', mb: 2 }}>
          <List aria-label={`Current sub-tasks for ${task?.title}`}>
            {subTasks.map((subTask) => (
              <Paper key={subTask.id} variant="outlined" sx={{ mb: 2, p: 0, overflow: 'hidden', bgcolor: 'background.paper' }}>
                <ListItem
                  secondaryAction={
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <IconButton
                        edge="end"
                        size="small"
                        color="primary"
                        onClick={() => handleStartSubTask(subTask.id)}
                        aria-label={`Start timer for ${subTask.title}`}
                      >
                        <PlayArrowIcon />
                      </IconButton>
                      <IconButton
                        edge="end"
                        size="small"
                        color="error"
                        onClick={() => handleDeleteSubTask(subTask.id)}
                        aria-label={`Delete ${subTask.title}`}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  }
                >
                  <ListItemText
                    primary={<Typography variant="subtitle1" fontWeight="600">{subTask.title}</Typography>}
                    secondary={
                      <Stack spacing={1} mt={1}>
                        <Typography variant="caption" color="text.secondary">
                          {subTask.priority} · {subTask.duration} mins
                        </Typography>
                        <FormControl size="small" fullWidth>
                          <Select
                            value={subTask.status}
                            onChange={(e) => handleStatusChange(subTask.id, e.target.value)}
                            // Removed label for cleaner look in list, relying on aria-label
                            inputProps={{ 'aria-label': 'Sub-task status' }}
                            sx={{ fontSize: '0.8rem', height: 32 }}
                          >
                            <MenuItem value="Pending">Pending</MenuItem>
                            <MenuItem value="In Progress">In Progress</MenuItem>
                            <MenuItem value="Completed">Completed</MenuItem>
                          </Select>
                        </FormControl>
                      </Stack>
                    }
                  />
                </ListItem>
              </Paper>
            ))}
          </List>
        </Box>

        {/* AI Generation */}
        <Box sx={{ mb: 3 }}>
          <Button
            variant="outlined"
            fullWidth
            onClick={handleGenerateSubTasks}
            disabled={isGenerating}
            startIcon={isGenerating ? <CircularProgress size={20} color="inherit" /> : <AutoAwesomeIcon />}
            sx={{ mb: 2, borderStyle: 'dashed' }}
          >
            {isGenerating ? "AI is thinking..." : "AI Suggest Sub-Tasks"}
          </Button>

          {generatedSubTasks.length > 0 && (
            <Paper variant="outlined" sx={{ p: 2, bgcolor: 'action.hover' }}>
              <Typography variant="subtitle2" gutterBottom fontWeight="bold">
                Suggested ({generatedSubTasks.length})
              </Typography>
              <List dense>
                {generatedSubTasks.map((st, idx) => (
                  <ListItem key={idx} disablePadding>
                    <ListItemText primary={st.title} secondary={`${st.priority} · ${st.duration} min`} />
                  </ListItem>
                ))}
              </List>
              <Button
                variant="contained"
                fullWidth
                size="small"
                onClick={handleAddGeneratedSubTasks}
                disabled={isAddingGenerated}
                sx={{ mt: 1 }}
              >
                Add All
              </Button>
            </Paper>
          )}
        </Box>

        {/* Manual Add */}
        <Box component={Paper} elevation={0} sx={{ bgcolor: 'action.hover', p: 2, borderRadius: 2 }}>
          <Typography variant="subtitle2" gutterBottom fontWeight="bold">
            New Sub-Task
          </Typography>
          <Stack spacing={2}>
            <TextField
              fullWidth
              size="small"
              placeholder="Title"
              value={newSubTask.title}
              onChange={(e) => setNewSubTask((prev) => ({ ...prev, title: e.target.value }))}
            />
            <Stack direction="row" spacing={1}>
              <TextField
                size="small"
                type="number"
                placeholder="Min"
                value={newSubTask.duration}
                onChange={(e) => setNewSubTask((prev) => ({ ...prev, duration: e.target.value }))}
                sx={{ width: 80 }}
              />
              <FormControl size="small" fullWidth>
                <Select
                  value={newSubTask.priority}
                  onChange={(e) => setNewSubTask((prev) => ({ ...prev, priority: e.target.value }))}
                >
                  <MenuItem value="Low">Low</MenuItem>
                  <MenuItem value="Medium">Medium</MenuItem>
                  <MenuItem value="High">High</MenuItem>
                </Select>
              </FormControl>
            </Stack>
            <Button
              startIcon={<AddIcon />}
              variant="contained"
              fullWidth
              onClick={handleAddSubTask}
            >
              Add
            </Button>
          </Stack>
        </Box>
      </Box>
    </Drawer>
  );
};

export default SubTaskDrawer;