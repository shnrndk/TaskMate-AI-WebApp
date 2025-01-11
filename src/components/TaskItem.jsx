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
} from '@mui/material';
import TimerIcon from '@mui/icons-material/Timer';
import DeleteIcon from '@mui/icons-material/Delete';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';

const TaskCard = ({ task, onDelete, onStatusChange, onNavigate, handleSubTasking }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleCardClick = () => {
    setIsExpanded(!isExpanded);
  };

  const handleButtonClick = (e, callback) => {
    e.stopPropagation(); // Prevent card expansion when clicking buttons
    callback();
  };

  return (
    <Box 
      onClick={handleCardClick}
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
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography sx={{ fontSize: "1.25rem", fontWeight: "500" }}>
            {task.title}
          </Typography>
          {isExpanded ? 
            <KeyboardArrowUpIcon color="action" /> : 
            <KeyboardArrowDownIcon color="action" />
          }
        </Box>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<TimerIcon />}
            onClick={(e) => handleButtonClick(e, () => onNavigate(task.id))}
            size="small"
          >
            TIMER
          </Button>
          <IconButton 
            size="small" 
            onClick={(e) => handleButtonClick(e, () => onDelete(task.id))}
            sx={{ color: "#ef5350" }}
          >
            <DeleteIcon />
          </IconButton>
        </Box>
      </Box>

      {/* Basic Info - Always Visible */}
      <Typography sx={{ color: "text.secondary", fontSize: "0.875rem", mb: isExpanded ? 2 : 0 }}>
        {task.category} • {task.priority} • {task.duration}min
      </Typography>
      
      {/* Expandable Content */}
      <Collapse in={isExpanded}>
        <Box sx={{ mt: 2 }}>
          <Typography sx={{ color: "text.secondary", mb: 2 }}>
            {task.description}
          </Typography>
          
          <Box sx={{ mb: 2 }}>
            <FormControl fullWidth onClick={(e) => e.stopPropagation()}>
              <Select
                value={task.status}
                onChange={(e) => onStatusChange(task.id, e.target.value)}
                size="small"
                sx={{
                  fontSize: '14px',
                  '& .MuiSelect-select': {
                    padding: '8px'
                  }
                }}
              >
                <MenuItem value="PENDING">PENDING</MenuItem>
                <MenuItem value="IN_PROGRESS">IN_PROGRESS</MenuItem>
                <MenuItem value="COMPLETED">COMPLETED</MenuItem>
              </Select>
            </FormControl>
          </Box>

          <Button
            fullWidth
            variant="outlined"
            color="primary"
            onClick={(e) => handleButtonClick(e, () => handleSubTasking(task))}
            sx={{ 
              textTransform: "none",
              fontWeight: "normal"
            }}
          >
            MANAGE SUB-TASKS
          </Button>
        </Box>
      </Collapse>
    </Box>
  );
};

export default TaskCard;