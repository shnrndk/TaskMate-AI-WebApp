import React, { useState } from "react";
import { fetchWithAuth } from "../utils/api";
import {
  TextField,
  Button,
  Typography,
  Box,
  MenuItem,
  Grid,
  FormControl, // Import FormControl and InputLabel for Select components
  InputLabel,
} from "@mui/material";

const TaskForm = ({ onTaskAdded }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [duration, setDuration] = useState("");
  const [priority, setPriority] = useState("");

  const [eventDate, setEventDate] = useState(""); // YYYY-MM-DD
  const [eventTime, setEventTime] = useState(""); // HH:MM
  
  // 🔹 NEW: State for ARIA Live region announcements
  const [liveMessage, setLiveMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLiveMessage("Submitting task form..."); // 🔹 A11y: Announce start of submission

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

      // 2) Save event to localStorage for the calendar (if date/time are provided)
      try {
        if (eventDate && eventTime && duration) {
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
          
          setLiveMessage(`Task "${title}" added successfully and scheduled for ${eventDate} at ${eventTime}.`); // 🔹 A11y: Success
        } else {
           setLiveMessage(`Task "${title}" added successfully.`); // 🔹 A11y: Success (no calendar event)
        }
      } catch (err) {
        console.error("Failed to save event:", err);
        setLiveMessage("Task added, but failed to save the event to the local calendar."); // 🔹 A11y: Partial success
      }

      // 3) Clear form fields
      setTitle("");
      setDescription("");
      setCategory("");
      setDuration("");
      setPriority("");
      setEventDate("");
      setEventTime("");
    } else {
      setLiveMessage("Failed to add task. Please check your network connection or server status."); // 🔹 A11y: Failure
      // alert("Failed to add task.");
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
      // 1. Give the form an accessible name
      aria-labelledby="task-form-title"
    >
      {/* 2. ARIA Live Region for dynamic announcements */}
      <Box 
        aria-live="assertive" 
        sx={{ position: 'absolute', clip: 'rect(0 0 0 0)', width: 1, height: 1, margin: -1, padding: 0, overflow: 'hidden' }}
      >
        {liveMessage}
      </Box>
      
      {/* 3. Assign an ID for the form title */}
      <Typography variant="h5" align="center" gutterBottom id="task-form-title">
        Create a Task
      </Typography>

      {/* 4. Task Title Field */}
      <TextField
        fullWidth
        label="Task Title" // 🔹 A11y: More descriptive label
        id="task-title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
        // 🔹 A11y: The required prop handles aria-required="true"
        sx={{ mb: 2 }}
      />

      {/* 5. Description Field */}
      <TextField
        fullWidth
        label="Task Description (Optional)" // 🔹 A11y: Clearly state it's optional
        id="task-description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        multiline
        rows={4}
        sx={{ mb: 2 }}
      />

      {/* NEW: Event Date + Time row */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={6}>
          {/* 6. Date Field */}
          <TextField
            fullWidth
            label="Schedule Date (Required)" // 🔹 A11y: Explicitly required
            id="event-date"
            type="date"
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            required
            // 🔹 A11y: Add descriptive text for the required nature
            aria-describedby="date-time-hint"
          />
        </Grid>
        <Grid item xs={6}>
          {/* 7. Time Field */}
          <TextField
            fullWidth
            label="Schedule Start Time (Required)" // 🔹 A11y: Explicitly required
            id="event-time"
            type="time"
            value={eventTime}
            onChange={(e) => setEventTime(e.target.value)}
            InputLabelProps={{ shrink: true }}
            required
            aria-describedby="date-time-hint"
          />
        </Grid>
      </Grid>
       {/* A11y: Hint for required fields, visible or hidden */}
       <Typography variant="caption" color="text.secondary" id="date-time-hint" sx={{ display: 'block', mb: 1, mt: -1 }}>
        Date and Time are required to schedule the task on the calendar.
      </Typography>

      <Grid container spacing={2}>
        {/* 8. Category Select */}
        <Grid item xs={4}>
          <FormControl fullWidth required>
             <InputLabel id="category-label">Category</InputLabel>
             <Select
              labelId="category-label"
              id="category-select"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              label="Category"
              // 🔹 A11y: The 'label' prop handles the Select's accessible name
            >
              <MenuItem value="Research">Research</MenuItem>
              <MenuItem value="Study">Study</MenuItem>
              <MenuItem value="Work">Work</MenuItem>
              <MenuItem value="Personal">Personal</MenuItem>
              <MenuItem value="Exercise">Exercise</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        {/* 9. Duration Field */}
        <Grid item xs={4}>
          <TextField
            fullWidth
            label="Duration (in minutes)"
            id="task-duration"
            type="number"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            required
            inputProps={{
              // 🔹 A11y: Set min value for clarity, assume positive duration
              min: "1", 
              'aria-describedby': 'duration-hint'
            }}
          />
        </Grid>

        {/* 10. Priority Select */}
        <Grid item xs={4}>
          <FormControl fullWidth required>
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
      </Grid>
      
      {/* 11. Duration hint (hidden for visual users, announced if focused) */}
      <Typography variant="caption" color="text.secondary" id="duration-hint" sx={{ display: 'block', mt: 1 }}>
        Enter the expected duration in positive minutes.
      </Typography>

      {/* 12. Submit Button */}
      <Button
        type="submit"
        variant="contained"
        color="primary"
        fullWidth
        sx={{ mt: 2 }}
        // 🔹 A11y: Explicitly label the button action
        aria-label="Add Task and Schedule Event"
      >
        Add Task
      </Button>
    </Box>
  );
};

export default TaskForm;