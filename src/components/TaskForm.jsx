import React, { useState } from "react";
import { fetchWithAuth } from "../utils/api";
import {
  TextField,
  Button,
  Typography,
  Box,
  MenuItem,
  Grid,
} from "@mui/material";

const TaskForm = ({ onTaskAdded }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [duration, setDuration] = useState("");
  const [priority, setPriority] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newTask = {
      title,
      description,
      category,
      duration: parseInt(duration, 10), // Ensure duration is a number
      priority,
    };
    const response = await fetchWithAuth("/api/tasks", {
      method: "POST",
      body: JSON.stringify(newTask),
    });

    if (response.ok) {
      onTaskAdded();
      setTitle("");
      setDescription("");
      setCategory("");
      setDuration("");
      setPriority("");
    } else {
      alert("Failed to add task.");
    }
  };

  return (
    <Box
      component="form"
      sx={{
        maxWidth: 600,
        mx: "auto",
        mt: 4,
        p: 3,
        border: "1px solid #ddd",
        borderRadius: 2,
        boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)",
      }}
      onSubmit={handleSubmit}
    >
      <Typography variant="h5" align="center" gutterBottom>
        Create a Task
      </Typography>
      <TextField
        fullWidth
        label="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
        sx={{ mb: 2 }}
      />
      <TextField
        fullWidth
        label="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        multiline
        rows={4}
        sx={{ mb: 2 }}
      />

      <Grid container spacing={2}>
        {/* Category */}
        <Grid item xs={4}>
          <TextField
            select
            fullWidth
            label="Category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required
          >
            <MenuItem value="Research">Research</MenuItem>
            <MenuItem value="Study">Study</MenuItem>
            <MenuItem value="Work">Work</MenuItem>
            <MenuItem value="Personal">Personal</MenuItem>
            <MenuItem value="Exercise">Exercise</MenuItem>
          </TextField>
        </Grid>
        {/* Duration */}
        <Grid item xs={4}>
          <TextField
            fullWidth
            label="Duration (in minutes)"
            type="number"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            required
          />
        </Grid>
        {/* Priority */}
        <Grid item xs={4}>
          <TextField
            select
            fullWidth
            label="Priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            required
          >
            <MenuItem value="Low">Low</MenuItem>
            <MenuItem value="Medium">Medium</MenuItem>
            <MenuItem value="High">High</MenuItem>
          </TextField>
        </Grid>
      </Grid>

      <Button
        type="submit"
        variant="contained"
        color="primary"
        fullWidth
        sx={{ mt: 2 }}
      >
        Add Task
      </Button>
    </Box>
  );
};

export default TaskForm;
