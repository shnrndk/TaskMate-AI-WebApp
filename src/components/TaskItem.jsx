import React from "react";
import { MenuItem, Select, IconButton, Button, Card, CardContent, CardActions, Typography, Box, Grid } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import TimerIcon from "@mui/icons-material/Timer";
import "../styles/TaskItem.css"; // Use this for any additional custom styling

const TaskItem = ({ task, onDelete, onStatusChange, onNavigate, handleSubTasking }) => {
  const handleStatusChange = (event) => {
    onStatusChange(task.id, event.target.value);
  };

  const handleOnDelete = () => {
    onDelete(task.id);
  }

  return (
    <Card sx={{ borderRadius: 3, boxShadow: 4, margin: 2, maxWidth: 400 }}>
      <CardContent>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="h5" sx={{ fontWeight: "bold", fontFamily: "'Roboto', sans-serif" }}>
            {task.title}
          </Typography>
          <Box>
          {task.subtasks_count === 0 && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<TimerIcon />}
              onClick={onNavigate}
              size="small"
              sx={{ marginRight: 1 }}
            >
              Timer
            </Button>
          )}
            <IconButton aria-label="delete" onClick={handleOnDelete} color="error">
              <DeleteIcon />
            </IconButton>
          </Box>
        </Box>
        <Box sx={{ marginTop: 2 }}>
          <Typography variant="body2" color="text.secondary">
            <strong>Description:</strong> {task.description}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            <strong>Category:</strong> {task.category}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            <strong>Priority:</strong> {task.priority}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            <strong>Duration:</strong> {task.duration} minutes
          </Typography>
        </Box>
        <Box sx={{ marginTop: 2 }}>
          <Typography variant="body2" color="text.secondary">
            <strong>Status:</strong>
          </Typography>
          <Select
            value={task.status}
            onChange={handleStatusChange}
            displayEmpty
            variant="outlined"
            size="small"
            sx={{ width: "100%", marginTop: 1 }}
          >
            <MenuItem value="Pending">Pending</MenuItem>
            <MenuItem value="In Progress">In Progress</MenuItem>
            <MenuItem value="Completed">Completed</MenuItem>
          </Select>
        </Box>
      </CardContent>
      <CardActions>
        <Button
          variant="outlined"
          color="primary"
          fullWidth
          onClick={() => handleSubTasking(task)}
        >
          Manage Sub-Tasks
        </Button>
      </CardActions>
    </Card>
  );
};

export default TaskItem;
