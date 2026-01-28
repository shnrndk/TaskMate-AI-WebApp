import React from "react";
import {
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  IconButton,
  Stack,
  Tooltip
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import TimerIcon from '@mui/icons-material/Timer';
import PlaylistAddCheckIcon from '@mui/icons-material/PlaylistAddCheck';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CategoryIcon from '@mui/icons-material/Category';

const TaskCard = ({ task, onDelete, onStatusChange, onNavigate, handleSubTasking }) => {
  const getPriorityColor = (priority) => {
    switch (priority) {
      case "High":
        return "error";
      case "Medium":
        return "warning";
      case "Low":
        return "success";
      default:
        return "default";
    }
  };

  return (
    <Card
      className="glass-card hover-glow"
      sx={{
        mb: 2,
        position: 'relative',
        overflow: 'visible'
      }}
      elevation={0}
    >
      <CardContent>
        {/* Header: Priority & Category */}
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
          <Chip
            size="small"
            label={task.priority}
            color={getPriorityColor(task.priority)}
            sx={{ fontWeight: 'bold', fontSize: '0.7rem' }}
          />
          <Stack direction="row" alignItems="center" spacing={0.5} sx={{ color: 'text.secondary', fontSize: '0.8rem' }}>
            <CategoryIcon fontSize="inherit" />
            <Typography variant="caption">{task.category}</Typography>
          </Stack>
        </Stack>

        {/* Title & Description */}
        <Typography variant="h6" gutterBottom fontWeight="600" sx={{ lineHeight: 1.3 }}>
          {task.title}
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph sx={{ mb: 2, minHeight: '3em' }}>
          {task.description || "No description provided."}
        </Typography>

        {/* Duration & Time */}
        <Stack direction="row" spacing={2} sx={{ mb: 2, color: 'text.secondary' }}>
          <Stack direction="row" alignItems="center" spacing={0.5}>
            <AccessTimeIcon fontSize="small" />
            <Typography variant="caption">{task.duration} min</Typography>
          </Stack>
        </Stack>

        {/* Action Buttons */}
        <Stack direction="row" justifyContent="space-between" alignItems="center" mt={2}>
          {/* Left: Functional Actions */}
          <Stack direction="row" spacing={1}>
            {task.status !== "Completed" && (
              <Tooltip title={task.status === "In Progress" ? "View Timer" : "Start Timer"}>
                <IconButton
                  size="small"
                  onClick={() => onNavigate(task.id)}
                  sx={{
                    bgcolor: task.status === "In Progress" ? 'primary.main' : 'rgba(233, 69, 96, 0.1)',
                    color: task.status === "In Progress" ? 'white' : 'primary.main',
                    '&:hover': {
                      bgcolor: task.status === "In Progress" ? 'primary.dark' : 'primary.main',
                      color: 'white'
                    }
                  }}
                >
                  <TimerIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            <Tooltip title="Sub-tasks">
              <IconButton
                size="small"
                onClick={() => handleSubTasking(task)}
                sx={{ bgcolor: 'rgba(255, 255, 255, 0.05)', '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.1)' } }}
              >
                <PlaylistAddCheckIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>

          {/* Right: Status & Delete */}
          <Stack direction="row" spacing={1}>
            {task.status !== "Completed" && (
              <Button
                size="small"
                variant="outlined"
                color="success"
                onClick={() => onStatusChange(task.id, "Completed")}
                sx={{ fontSize: '0.7rem', py: 0.5 }}
              >
                Done
              </Button>
            )}
            <Tooltip title="Archive Task">
              <IconButton
                size="small"
                onClick={() => onDelete(task.id)}
                color="default"
                sx={{ opacity: 0.7, '&:hover': { opacity: 1, color: 'error.main' } }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
};

export default TaskCard;