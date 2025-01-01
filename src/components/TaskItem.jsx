import React from "react";
import { MenuItem, Select, IconButton } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import "../styles/TaskItem.css";

const TaskItem = ({ task, onDelete, onStatusChange, onNavigate }) => {
  const handleStatusChange = (event) => {
    onStatusChange(task.id, event.target.value);
  };

  return (
    <div className="task-item" onClick={onNavigate} style={{ cursor: "pointer" }}>
      <div className="task-header">
        <h3>{task.title}</h3>
        <IconButton
          aria-label="delete"
          onClick={(e) => {
            e.stopPropagation(); // Prevent navigation
            onDelete(task.id);
          }}
          color="error"
        >
          <DeleteIcon />
        </IconButton>
      </div>
      <p><strong>Description:</strong> {task.description}</p>
      <p><strong>Category:</strong> {task.category}</p>
      <p><strong>Priority:</strong> {task.priority}</p>
      <p><strong>Duration:</strong> {task.duration} minutes</p>
      <p>
        <strong>Status:</strong>{" "}
        <Select
          value={task.status}
          onChange={(e) => {
            e.stopPropagation(); // Prevent navigation
            handleStatusChange(e);
          }}
          displayEmpty
          variant="outlined"
          size="small"
        >
          <MenuItem value="Pending">Pending</MenuItem>
          <MenuItem value="In Progress">In Progress</MenuItem>
          <MenuItem value="Completed">Completed</MenuItem>
        </Select>
      </p>
    </div>
  );
};

export default TaskItem;
