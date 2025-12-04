import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  IconButton,
  FormControl,
  Select,
  MenuItem,
  Collapse,
  InputLabel, // Import InputLabel for accessible Select
} from '@mui/material';
import TimerIcon from '@mui/icons-material/Timer';
import DeleteIcon from '@mui/icons-material/Delete';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';

const TaskCard = ({ task, onDelete, onStatusChange, onNavigate, handleSubTasking }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // 🔹 NEW: Function to toggle expansion and provide ARIA announcement
  const handleCardClick = () => {
    setIsExpanded((prev) => {
      const newState = !prev;
      // You could use a separate ARIA live region if needed, but for simple collapse, 
      // the state change on the button/div should suffice if properly handled.
      return newState;
    });
  };

  const handleButtonClick = (e, callback) => {
    e.stopPropagation(); // Prevent card expansion when clicking buttons
    callback();
  };

  const statusId = `status-select-${task.id}`;
  const statusLabelId = `status-label-${task.id}`;

  return (
    <Box 
      // 1. Give the card a button role and manage state for screen readers
      role="button"
      tabIndex={0} // Make the entire box focusable
      aria-expanded={isExpanded} // Announce the expansion state
      aria-controls={`task-details-${task.id}`} // Link to the collapsible content
      onClick={handleCardClick}
      onKeyDown={(e) => {
        // Allow activation via Space or Enter keys for accessibility
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleCardClick();
        }
      }}
      sx={{ 
        backgroundColor: "white",
        borderRadius: 2,
        mb: 2,
        p: 2,
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        border: "1px solid rgba(0,0,0,0.12)",
        cursor: "pointer",
        transition: "all 0.2s ease",
        '&:hover': {
          boxShadow: "0 4px 8px rgba(0,0,0,0.15)",
        }
      }}
    >
      {/* Header - Always Visible */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1 }}>
        {/* 2. Group the title and expand icon for announcement */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography sx={{ fontSize: "1.25rem", fontWeight: "500" }}>
            {task.title}
          </Typography>
          {/* Icon visually indicates expansion state, no separate ARIA needed here */}
          {isExpanded ? 
            <KeyboardArrowUpIcon color="action" aria-hidden="true" /> : 
            <KeyboardArrowDownIcon color="action" aria-hidden="true" />
          }
        </Box>
        <Box sx={{ display: "flex", gap: 1 }}>
          {/* 3. Timer Button - Explicit ARIA label */}
          <Button
            variant="contained"
            color="primary"
            startIcon={<TimerIcon />}
            onClick={(e) => handleButtonClick(e, () => onNavigate(task.id))}
            size="small"
            aria-label={`Start Pomodoro timer for task ${task.title}`}
          >
            TIMER
          </Button>
          {/* 4. Delete Button - Explicit ARIA label */}
          <IconButton 
            size="small" 
            onClick={(e) => handleButtonClick(e, () => onDelete(task.id))}
            sx={{ color: "#ef5350" }}
            aria-label={`Delete task ${task.title}`}
          >
            <DeleteIcon />
          </IconButton>
        </Box>
      </Box>

      {/* Basic Info - Always Visible */}
      <Typography sx={{ color: "text.secondary", fontSize: "0.875rem", mb: isExpanded ? 2 : 0 }}>
        Category: {task.category} • Priority: {task.priority} • Duration: {task.duration} minutes
      </Typography>
      
      {/* Expandable Content */}
      <Collapse in={isExpanded} id={`task-details-${task.id}`}>
        <Box sx={{ mt: 2 }}>
          {/* 5. Description Content */}
          <Typography 
            component="p" // Ensure semantic paragraph
            sx={{ color: "text.secondary", mb: 2 }}
          >
            **Description:** {task.description}
          </Typography>
          
          <Box sx={{ mb: 2 }}>
            {/* 6. Status Select - Use FormControl and InputLabel for accessibility */}
            <FormControl 
              fullWidth 
              onClick={(e) => e.stopPropagation()}
              // Give the form control a unique accessible name
              aria-label={`Change status of task ${task.title}`}
            >
              <InputLabel id={statusLabelId} size="small">Status</InputLabel>
              <Select
                labelId={statusLabelId}
                id={statusId}
                value={task.status}
                onChange={(e) => onStatusChange(task.id, e.target.value)}
                size="small"
                label="Status"
                sx={{
                  fontSize: '14px',
                  '& .MuiSelect-select': {
                    padding: '8px'
                  }
                }}
              >
                <MenuItem value="Pending">Pending</MenuItem>
                <MenuItem value="In Progress">In Progress</MenuItem>
                <MenuItem value="Completed">Completed</MenuItem>
              </Select>
            </FormControl>
          </Box>

          {/* 7. Sub-Task Button - Explicit ARIA label */}
          <Button
            fullWidth
            variant="outlined"
            color="primary"
            onClick={(e) => handleButtonClick(e, () => handleSubTasking(task))}
            sx={{ 
              textTransform: "none",
              fontWeight: "normal"
            }}
            aria-label={`Manage sub-tasks for ${task.title}`}
          >
            MANAGE SUB-TASKS
          </Button>
        </Box>
      </Collapse>
    </Box>
  );
};

export default TaskCard;