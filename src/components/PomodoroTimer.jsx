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
  const [totalTime, setTotalTime] = useState(WORK_TIME);
  const [isStarted, setIsStarted] = useState(false);

  const checkTaskStatus = async () => {
    try {
      const response = await fetchWithAuth(`/api/tasks/${id}/status`);
      if (response.ok) {
        const data = await response.json();
        setIsStarted(data.isStarted);
        setIsRunning(data.isStarted);
      } else {
        console.error("Failed to fetch task status.");
      }
    } catch (err) {
      console.error("Error checking task status:", err);
    }
  };

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
        setIsStarted(true); // If we have saved state, the task was started
      }
    }
  }, [id]);

  // Check if the task is started
  useEffect(() => {
    checkTaskStatus();
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
    }, 60000);

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

  const startTask = async () => {
    try {
      setIsRunning(true);
      setIsStarted(true);
      setTotalTime(WORK_TIME);
      await fetchWithAuth(`/api/tasks/${id}/start`, { method: "PUT" });
    } catch (err) {
      console.error("Failed to start task:", err);
    }
  };

  const autoPauseTask = async () => {
    try {
      setIsRunning(false);
      await fetchWithAuth(`/api/tasks/${id}/pause`, { method: "PUT" });
    } catch (err) {
      console.error("Failed to auto-pause task:", err);
    }
  };

  const resumeTask = async () => {
    try {
      setIsRunning(true);
      await fetchWithAuth(`/api/tasks/${id}/resume`, { method: "PUT" });
    } catch (err) {
      console.error("Failed to resume task:", err);
    }
  };

  const pauseBreak = () => {
    setIsRunning(false);
  };

  const resumeBreak = () => {
    setIsRunning(true);
  };

  const handleTimerEnd = async () => {
    if (isBreak) {
      setIsBreak(false);
      setTime(WORK_TIME);
      setTotalTime(WORK_TIME);
      await resumeTask();
    } else {
      const newCount = pomodoroCount + 1;
      setPomodoroCount(newCount);

      if (newCount % LONG_BREAK_THRESHOLD === 0) {
        setTime(LONG_BREAK);
        setTotalTime(LONG_BREAK);
      } else {
        setTime(SHORT_BREAK);
        setTotalTime(SHORT_BREAK);
      }

      setIsBreak(true);
      await autoPauseTask();
    }
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
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
        {!isStarted && (
          <Button
            variant="contained"
            color="primary"
            onClick={startTask}
            disabled={isRunning}
          >
            Start Task
          </Button>
        )}
        {isStarted && !isBreak && (
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
        {isStarted && isBreak && (
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
        )}
      </Box>
      <Typography variant="body1" sx={{ mt: 2 }}>
        Pomodoro Cycles Completed: {pomodoroCount}
      </Typography>
    </Box>
  );
};

export default PomodoroTimer;