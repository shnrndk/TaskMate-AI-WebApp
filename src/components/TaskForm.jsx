import React, { useState } from "react";
import { fetchWithAuth } from "../utils/api";
import {
  TextField,
  Button,
  Typography,
  Box,
  MenuItem,
  Grid,
  FormControl,
  InputLabel,
  Select,
  Paper,
  Stack,
  FormControlLabel,
  Switch,
  Collapse
} from "@mui/material";
import AddTaskIcon from '@mui/icons-material/AddTask';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';

const TaskForm = ({ onTaskAdded }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [duration, setDuration] = useState("");
  const [priority, setPriority] = useState("");

  // Scheduling State
  const [isScheduled, setIsScheduled] = useState(false);
  const [eventDate, setEventDate] = useState(""); // YYYY-MM-DD
  const [eventTime, setEventTime] = useState(""); // HH:MM

  // ARIA Live region
  const [liveMessage, setLiveMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLiveMessage("Submitting task form...");

    const newTask = {
      title,
      description,
      category,
      duration: parseInt(duration, 10),
      priority,
    };

    const response = await fetchWithAuth("/api/tasks", {
      method: "POST",
      body: JSON.stringify(newTask),
    });

    if (response.ok) {
      onTaskAdded();

      // Save event to localStorage for the calendar ONLY if scheduled
      try {
        if (isScheduled && eventDate && eventTime && duration) {
          const start = new Date(`${eventDate}T${eventTime}`);
          const durMinutes = parseInt(duration, 10);
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

          setLiveMessage(`Task "${title}" added successfully and scheduled for ${eventDate} at ${eventTime}.`);
        } else {
          setLiveMessage(`Task "${title}" added successfully.`);
        }
      } catch (err) {
        console.error("Failed to save event:", err);
        setLiveMessage("Task added, but failed to save the event to the local calendar.");
      }

      // Clear form fields
      setTitle("");
      setDescription("");
      setCategory("");
      setDuration("");
      setPriority("");
      setEventDate("");
      setEventTime("");
      setIsScheduled(false); // Reset schedule toggle
    } else {
      setLiveMessage("Failed to add task. Please check your network connection or server status.");
    }
  };

  return (
    <Paper
      elevation={4}
      className="glass-card"
      sx={{
        maxWidth: 700,
        mx: "auto",
        mt: 6,
        mb: 6,
        p: 4,
      }}
    >
      <form onSubmit={handleSubmit} aria-labelledby="task-form-title">
        {/* ARIA Live Region */}
        <Box
          aria-live="assertive"
          sx={{ position: 'absolute', clip: 'rect(0 0 0 0)', width: 1, height: 1, margin: -1, padding: 0, overflow: 'hidden' }}
        >
          {liveMessage}
        </Box>

        <Stack direction="row" alignItems="center" justifyContent="center" spacing={1} sx={{ mb: 3 }}>
          <AddTaskIcon color="primary" sx={{ fontSize: 32 }} />
          <Typography variant="h4" align="center" id="task-form-title" fontWeight="700">
            Create New Task
          </Typography>
        </Stack>

        <Grid container spacing={3}>
          {/* Main Info */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              variant="outlined"
              label="Task Title"
              id="task-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="What needs to be done?"
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              variant="outlined"
              label="Description"
              id="task-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              multiline
              rows={3}
              placeholder="Add details about your task..."
            />
          </Grid>

          {/* Schedule Toggle */}
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={isScheduled}
                  onChange={(e) => setIsScheduled(e.target.checked)}
                  color="primary"
                />
              }
              label={
                <Stack direction="row" spacing={1} alignItems="center">
                  <CalendarMonthIcon color="action" fontSize="small" />
                  <Typography>Schedule this task</Typography>
                </Stack>
              }
            />
          </Grid>

          {/* Conditional Date/Time Inputs */}
          <Grid item xs={12}>
            <Collapse in={isScheduled}>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Schedule Date"
                    id="event-date"
                    type="date"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    required={isScheduled} // Only required if scheduled
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Start Time"
                    id="event-time"
                    type="time"
                    value={eventTime}
                    onChange={(e) => setEventTime(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    required={isScheduled} // Only required if scheduled
                  />
                </Grid>
              </Grid>
            </Collapse>
          </Grid>

          {/* Meta Info Row */}
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth required variant="outlined">
              <InputLabel id="category-label">Category</InputLabel>
              <Select
                labelId="category-label"
                id="category-select"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                label="Category"
              >
                <MenuItem value="Research">Research</MenuItem>
                <MenuItem value="Study">Study</MenuItem>
                <MenuItem value="Work">Work</MenuItem>
                <MenuItem value="Personal">Personal</MenuItem>
                <MenuItem value="Exercise">Exercise</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Duration (min)"
              id="task-duration"
              type="number"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              required
              inputProps={{ min: "1" }}
            />
          </Grid>

          <Grid item xs={12} sm={4}>
            <FormControl fullWidth required variant="outlined">
              <InputLabel id="priority-label">Priority</InputLabel>
              <Select
                labelId="priority-label"
                id="priority-select"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                label="Priority"
              >
                <MenuItem value="Low">Low</MenuItem>
                <MenuItem value="Medium">Medium</MenuItem>
                <MenuItem value="High">High</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <Button
              type="submit"
              variant="contained"
              size="large"
              fullWidth
              sx={{
                mt: 1,
                py: 1.5,
                fontSize: '1.1rem'
              }}
            >
              Add Task to Board
            </Button>
          </Grid>
        </Grid>
      </form>
    </Paper>
  );
};

export default TaskForm;