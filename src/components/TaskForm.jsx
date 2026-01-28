import React, { useState, useEffect } from "react";
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
  Collapse,
  Autocomplete,
  createFilterOptions
} from "@mui/material";
import AddTaskIcon from '@mui/icons-material/AddTask';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';

// Default categories
const DEFAULT_CATEGORIES = ["Research", "Study", "Work", "Personal", "Exercise"];

const filter = createFilterOptions();

const TaskForm = ({ onTaskAdded, initialData = null, minimal = false }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [duration, setDuration] = useState("");
  const [priority, setPriority] = useState("");

  // Categories State
  const [categoriesList, setCategoriesList] = useState(DEFAULT_CATEGORIES);

  // Scheduling State
  const [isScheduled, setIsScheduled] = useState(false);
  const [eventDate, setEventDate] = useState(""); // YYYY-MM-DD
  const [eventTime, setEventTime] = useState(""); // HH:MM

  // Fetch custom categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetchWithAuth("/api/categories");
        if (response.ok) {
          const data = await response.json();
          const customNames = data.map(c => c.name);
          // Merge default and custom, creating a unique set
          setCategoriesList(prev => [...new Set([...prev, ...customNames])]);
        }
      } catch (err) {
        console.error("Failed to fetch categories", err);
      }
    };
    fetchCategories();
  }, []);

  // Pre-fill form if initialData is provided
  useEffect(() => {
    if (initialData) {
      if (initialData.date) setEventDate(initialData.date);
      if (initialData.time) setEventTime(initialData.time);
      if (initialData.duration) setDuration(initialData.duration);
      if (initialData.date || initialData.time) setIsScheduled(true);
    }
  }, [initialData]);

  // Calculate End Time for display
  const getDisplayTimeRange = () => {
    if (!eventDate || !eventTime || !duration) return "";
    try {
      const start = new Date(`${eventDate}T${eventTime}:00`);
      const durMinutes = parseInt(duration, 10);
      const end = new Date(start.getTime() + durMinutes * 60 * 1000);

      return `${new Date(`${eventDate}T00:00:00`).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })} • ${eventTime} - ${end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}`;
    } catch (e) {
      return "";
    }
  };

  // ARIA Live region
  const [liveMessage, setLiveMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLiveMessage("Submitting task form...");

    let startTime = null;
    let endTime = null;

    if (isScheduled && eventDate && eventTime && duration) {
      const start = new Date(`${eventDate}T${eventTime}:00`);
      const durMinutes = parseInt(duration, 10);
      const end = new Date(start.getTime() + durMinutes * 60 * 1000);

      startTime = start.toISOString();
      endTime = end.toISOString();
    }

    const newTask = {
      title,
      description,
      category,
      duration: parseInt(duration, 10),
      priority,
      startTime,
      endTime
    };

    const response = await fetchWithAuth("/api/tasks", {
      method: "POST",
      body: JSON.stringify(newTask),
    });

    if (response.ok) {
      onTaskAdded();

      if (isScheduled) {
        setLiveMessage(`Task "${title}" added successfully and scheduled for ${eventDate} at ${eventTime}.`);
      } else {
        setLiveMessage(`Task "${title}" added successfully.`);
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
      // Keep categories list as is
    } else {
      setLiveMessage("Failed to add task. Please check your network connection or server status.");
    }
  };

  return (
    <Paper
      elevation={minimal ? 0 : 4}
      className={minimal ? "" : "glass-card"}
      sx={{
        maxWidth: minimal ? '100%' : 700,
        mx: "auto",
        mt: minimal ? 0 : 6,
        mb: minimal ? 0 : 6,
        p: minimal ? 2 : 4,
        background: minimal ? 'transparent' : undefined,
        border: minimal ? 'none' : undefined
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

        {!minimal && (
          <Stack direction="row" alignItems="center" justifyContent="center" spacing={1} sx={{ mb: 3 }}>
            <AddTaskIcon color="primary" sx={{ fontSize: 32 }} />
            <Typography variant="h4" align="center" id="task-form-title" fontWeight="700">
              Create New Task
            </Typography>
          </Stack>
        )}

        {minimal && (
          <Box sx={{ mb: 3, textAlign: 'center' }}>
            <Typography variant="h5" fontWeight="700" gutterBottom>
              New Event
            </Typography>
            <Typography variant="body1" color="primary" fontWeight="600" sx={{ bgcolor: 'action.hover', py: 1, px: 2, borderRadius: 2, display: 'inline-block' }}>
              {getDisplayTimeRange()}
            </Typography>
          </Box>
        )}

        <Grid container spacing={minimal ? 2 : 3}>
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
              size={minimal ? "small" : "medium"}
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
              rows={minimal ? 2 : 3}
              placeholder="Add details about your task..."
              size={minimal ? "small" : "medium"}
            />
          </Grid>

          {/* Schedule Toggle & Date Inputs - Hidden in Minimal Mode (Already set via initialData) */}
          {!minimal && (
            <>
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
                        required={isScheduled}
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
                        required={isScheduled}
                      />
                    </Grid>
                  </Grid>
                </Collapse>
              </Grid>
            </>
          )}

          {/* Meta Info Row */}
          <Grid item xs={12} sm={4}>
            <Autocomplete
              freeSolo
              id="category-select"
              options={categoriesList}
              value={category}
              onChange={(event, newValue) => {
                let finalValue = newValue;

                if (typeof newValue === 'string') {
                  finalValue = newValue;
                } else if (newValue && newValue.inputValue) {
                  // Create a new value from the user input
                  finalValue = newValue.inputValue;
                }

                setCategory(finalValue);

                // Check if it's a new category and persist it
                if (finalValue && !categoriesList.includes(finalValue)) {
                  // Optimistic update
                  setCategoriesList(prev => [...prev, finalValue]);

                  fetchWithAuth("/api/categories", {
                    method: "POST",
                    body: JSON.stringify({ name: finalValue })
                  }).catch(err => console.error("Failed to create category", err));
                }
              }}
              filterOptions={(options, params) => {
                const filtered = filter(options, params);

                const { inputValue } = params;
                // Suggest the creation of a new value
                const isExisting = options.some((option) => inputValue === option);
                if (inputValue !== '' && !isExisting) {
                  filtered.push({
                    inputValue,
                    title: `Add "${inputValue}"`,
                  });
                }

                return filtered;
              }}
              getOptionLabel={(option) => {
                // Value selected with enter, right from the input
                if (typeof option === 'string') {
                  return option;
                }
                // Add "xxx" option created dynamically
                if (option.inputValue) {
                  return option.inputValue;
                }
                // Regular option
                return option;
              }}
              renderOption={(props, option) => (
                <li {...props}>
                  {option.title || option}
                </li>
              )}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Category"
                  required
                  fullWidth
                  variant="outlined"
                  size={minimal ? "small" : "medium"}
                />
              )}
            />
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