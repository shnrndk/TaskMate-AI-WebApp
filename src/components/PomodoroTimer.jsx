import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { fetchWithAuth } from "../utils/api";
import { Box, Typography, Button, CircularProgress } from "@mui/material";

const PomodoroTimer = () => {
  const { id } = useParams();
  const WORK_TIME = 25 * 60; // 25 minutes in seconds
  const SHORT_BREAK = 5 * 60; // 5 minutes in seconds
  const LONG_BREAK = 15 * 60; // 15 minutes in seconds
  const LONG_BREAK_THRESHOLD = 4; // Long break after 4 Pomodoro cycles

  const [time, setTime] = useState(WORK_TIME);
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [pomodoroCount, setPomodoroCount] = useState(0);
  const [totalTime, setTotalTime] = useState(WORK_TIME); // Total time for progress calculation

  // Restore state from localStorage
  useEffect(() => {
    const savedState = localStorage.getItem("pomodoroState");
    if (savedState) {
      const state = JSON.parse(savedState);
      if (state.taskId === id) {
        setTime(state.time);
        setIsRunning(state.isRunning);
        setIsBreak(state.isBreak);
        setPomodoroCount(state.pomodoroCount);
        setTotalTime(state.totalTime);
      }
    }
  }, [id]);

  // Save state to localStorage every minute
  useEffect(() => {
    const saveState = () => {
      const state = {
        taskId: id,
        time,
        isRunning,
        isBreak,
        pomodoroCount,
        totalTime,
      };
      localStorage.setItem("pomodoroState", JSON.stringify(state));
    };

    const interval = setInterval(() => {
      if (isRunning) saveState();
    }, 60000); // Save every 1 minute

    return () => clearInterval(interval);
  }, [id, time, isRunning, isBreak, pomodoroCount, totalTime]);

  // Timer logic
  useEffect(() => {
    let timer;
    if (isRunning) {
      timer = setInterval(() => {
        setTime((prevTime) => {
          if (prevTime > 0) {
            return prevTime - 1;
          } else {
            handleTimerEnd();
            return 0;
          }
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isRunning]);

  // Start task (work period)
  const startTask = async () => {
    try {
      setIsRunning(true);
      setTotalTime(WORK_TIME); // Set total time for progress bar
      await fetchWithAuth(`/api/tasks/${id}/start`, { method: "PUT" });
    } catch (err) {
      console.error("Failed to start task:", err);
    }
  };

  // Auto-pause when work period ends
  const autoPauseTask = async () => {
    try {
      setIsRunning(false);
      await fetchWithAuth(`/api/tasks/${id}/pause`, { method: "PUT" });
    } catch (err) {
      console.error("Failed to auto-pause task:", err);
    }
  };

  // Resume task (after break ends)
  const resumeTask = async () => {
    try {
      setIsRunning(true);
      await fetchWithAuth(`/api/tasks/${id}/resume`, { method: "PUT" });
    } catch (err) {
      console.error("Failed to resume task:", err);
    }
  };

  // Pause during breaks (UI-only)
  const pauseBreak = () => {
    setIsRunning(false); // Stop the timer without backend interaction
  };

  // Resume during breaks (UI-only)
  const resumeBreak = () => {
    setIsRunning(true); // Restart the timer without backend interaction
  };

  // Handle end of timer (work or break)
  const handleTimerEnd = async () => {
    if (isBreak) {
      // End of break, transition to work mode
      setIsBreak(false);
      setTime(WORK_TIME);
      setTotalTime(WORK_TIME); // Reset total time for progress bar
      await resumeTask(); // Call backend resume API after break
    } else {
      // End of work mode, transition to break
      const newCount = pomodoroCount + 1;
      setPomodoroCount(newCount);

      if (newCount % LONG_BREAK_THRESHOLD === 0) {
        // Long break after 4 Pomodoro cycles
        setTime(LONG_BREAK);
        setTotalTime(LONG_BREAK); // Update total time for progress bar
      } else {
        // Short break
        setTime(SHORT_BREAK);
        setTotalTime(SHORT_BREAK); // Update total time for progress bar
      }

      setIsBreak(true);
      await autoPauseTask(); // Call backend auto-pause API at end of work
    }
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const calculateProgress = () => {
    return ((totalTime - time) / totalTime) * 100;
  };

  return (
    <Box sx={{ maxWidth: 600, mx: "auto", mt: 4, textAlign: "center" }}>
      <Typography variant="h4">
        {isBreak
          ? pomodoroCount % LONG_BREAK_THRESHOLD === 0
            ? "Long Break"
            : "Short Break"
          : "Work Time"}
      </Typography>
      <Box sx={{ position: "relative", display: "inline-flex", my: 3 }}>
        <CircularProgress
          variant="determinate"
          value={calculateProgress()}
          size={200}
          thickness={4}
          color={isBreak ? "success" : "primary"}
        />
        <Box
          sx={{
            top: 0,
            left: 0,
            bottom: 0,
            right: 0,
            position: "absolute",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Typography variant="h2">{formatTime(time)}</Typography>
        </Box>
      </Box>
      <Box sx={{ display: "flex", justifyContent: "center", gap: 2 }}>
        <Button
          variant="contained"
          color="primary"
          onClick={() => startTask()}
          disabled={isRunning}
        >
          Start Task
        </Button>
        {isBreak ? (
          <>
            <Button
              variant="contained"
              color="secondary"
              onClick={pauseBreak}
              disabled={!isRunning}
            >
              Pause Break
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={resumeBreak}
              disabled={isRunning}
            >
              Resume Break
            </Button>
          </>
        ) : (
          <>
            <Button
              variant="contained"
              color="secondary"
              onClick={autoPauseTask}
              disabled={!isRunning}
            >
              Pause Work
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={resumeTask}
              disabled={isRunning}
            >
              Resume Work
            </Button>
          </>
        )}
      </Box>
      <Typography variant="body1" sx={{ mt: 2 }}>
        Pomodoro Cycles Completed: {pomodoroCount}
      </Typography>
    </Box>
  );
};

export default PomodoroTimer;
