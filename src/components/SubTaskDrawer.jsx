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
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import { fetchWithAuth } from "../utils/api";
import { useNavigate } from "react-router-dom";

const SubTaskDrawer = ({ open, onClose, task }) => {
  const [subTasks, setSubTasks] = useState([]);
  const navigate = useNavigate();
  const [newSubTask, setNewSubTask] = useState({
    title: "",
    priority: "Medium",
    duration: "",
  });
  useEffect(() => {
    if (task) {
      fetchSubTasks();
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
    const response = await fetchWithAuth(`/api/tasks/sub-tasks/${id}`, {
      method: "DELETE",
    });

    if (response.ok) {
      fetchSubTasks();
    } else {
      alert("Failed to delete sub-task.");
    }
  };

  const handleStartSubTask = async (id) => {
    navigate(`/sub-tasks/${id}/timer`)
  };

  const handleStatusChange = async (id, status) => {
    let tempSubTask;
    subTasks.map((subTask) => {
      if (subTask.id === id) {
        tempSubTask = subTask;
        tempSubTask.status = status;
      }
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

  return (
    <Drawer anchor="right" open={open} onClose={onClose}>
      <Box sx={{ width: 400, p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Sub-Tasks for: {task?.title}
        </Typography>
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
                        onChange={(e) => {
                          handleStatusChange(subTask.id, e.target.value)
                        }
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
        <Box sx={{ mt: 3 }}>
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
