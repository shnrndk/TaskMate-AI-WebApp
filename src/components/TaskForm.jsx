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

  // NEW: event date + time for calendar
  const [eventDate, setEventDate] = useState(""); // YYYY-MM-DD
  const [eventTime, setEventTime] = useState(""); // HH:MM

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newTask = {
      title,
      description,
      category,
      duration: parseInt(duration, 10), // Ensure duration is a number
      priority,
    };

    // 🔵 Do NOT touch this request (per your requirement)
    const response = await fetchWithAuth("/api/tasks", {
      method: "POST",
      body: JSON.stringify(newTask),
    });

    if (response.ok) {
      // ✅ 1) Notify parent
      onTaskAdded();

      // ✅ 2) Save event to localStorage for the calendar (if date/time are provided)
      // 2) Save event to localStorage for the calendar
      try {
        if (eventDate && eventTime && duration) {
          // Create JS Date from date + time
          const start = new Date(`${eventDate}T${eventTime}`);
          const durMinutes = parseInt(duration, 10);

          // NEW FIX: Create end time = start + duration (minutes)
          const end = new Date(start.getTime() + durMinutes * 60 * 1000);

          const STORAGE_KEY = "calendarEvents";
          const existingRaw = localStorage.getItem(STORAGE_KEY);
          const existingEvents = existingRaw ? JSON.parse(existingRaw) : [];

          const newEvent = {
            id: Date.now().toString(),
            title,
            category,
            priority,       
            start: start.toISOString(),
            end: end.toISOString(),
            duration: durMinutes
          };

          const updated = [...existingEvents, newEvent];
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        }
      } catch (err) {
        console.error("Failed to save event:", err);
      }

      // ✅ 3) Clear form fields
      setTitle("");
      setDescription("");
      setCategory("");
      setDuration("");
      setPriority("");
      setEventDate("");
      setEventTime("");
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

      {/* NEW: Event Date + Time row */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={6}>
          <TextField
            fullWidth
            label="Event Date"
            type="date"
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            required
          />
        </Grid>
        <Grid item xs={6}>
          <TextField
            fullWidth
            label="Event Start Time"
            type="time"
            value={eventTime}
            onChange={(e) => setEventTime(e.target.value)}
            InputLabelProps={{ shrink: true }}
            required
          />
        </Grid>
      </Grid>

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
