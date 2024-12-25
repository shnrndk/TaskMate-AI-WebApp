import React from "react";
import TaskList from "../components/TaskList";
import TaskForm from "../components/TaskForm";

const Home = () => {
  const handleTaskAdded = () => {
    window.location.reload(); // Refresh task list
  };

  return (
    <div>
      <TaskForm onTaskAdded={handleTaskAdded} />
      <TaskList />
    </div>
  );
};

export default Home;
