import React, { useState, useEffect } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { fetchWithAuth } from "../utils/api";
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Paper,
} from "@mui/material";

const PomodoroTimerForSubTasks = () => {
  const { id } = useParams();
  const WORK_TIME = 25 * 60;
  const SHORT_BREAK = 5 * 60;
  const LONG_BREAK = 15 * 60;
  const LONG_BREAK_THRESHOLD = 4;

  const [time, setTime] = useState(WORK_TIME);
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [pomodoroCount, setPomodoroCount] = useState(0);
  const [totalTime, setTotalTime] = useState(WORK_TIME);
  const [isStarted, setIsStarted] = useState(false);
  const [lastTimestamp, setLastTimestamp] = useState(null);
  const Navigate = useNavigate();

  // Handle visibility change for background tab timing
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setLastTimestamp(Date.now());
      } else {
        if (lastTimestamp && isRunning) {
          const elapsedSeconds = Math.floor((Date.now() - lastTimestamp) / 1000);
          setTime(prevTime => {
            const newTime = Math.max(0, prevTime - elapsedSeconds);
            if (newTime === 0) {
              handleTimerEnd();
            }
            return newTime;
          });
        }
        setLastTimestamp(null);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [lastTimestamp, isRunning]);

  const checkTaskStatus = async () => {
    try {
      const response = await fetchWithAuth(`/api/tasks/sub-tasks/${id}/status`);
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

  // Load saved state
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
        setIsStarted(true);
      }
    }
  }, [id]);

  useEffect(() => {
    checkTaskStatus();
  }, [id]);

  // Save state periodically
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

    if (isRunning) {
      saveState();
    }

    const interval = setInterval(() => {
      if (isRunning) saveState();
    }, 60000);

    return () => clearInterval(interval);
  }, [id, time, isRunning, isBreak, pomodoroCount, totalTime]);

  // Main timer logic using requestAnimationFrame
  useEffect(() => {
    let animationFrameId;
    let lastTick = Date.now();

    const tick = () => {
      if (isRunning) {
        const now = Date.now();
        const delta = Math.floor((now - lastTick) / 1000);

        if (delta >= 1) {
          setTime(prevTime => {
            const newTime = Math.max(0, prevTime - delta);
            if (newTime === 0) {
              handleTimerEnd();
            }
            return newTime;
          });
          lastTick = now;
        }

        animationFrameId = requestAnimationFrame(tick);
      }
    };

    if (isRunning) {
      lastTick = Date.now();
      animationFrameId = requestAnimationFrame(tick);
    }

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [isRunning]);

  const startTask = async () => {
    try {
      await fetchWithAuth(`/api/tasks/sub-tasks/${id}/start`, { method: "PUT" });
      setIsRunning(true);
      setIsStarted(true);
      setTotalTime(WORK_TIME);
      setTime(WORK_TIME);
      setIsBreak(false);
    } catch (err) {
      console.error("Failed to start task:", err);
    }
  };

  const autoPauseTask = async () => {
    try {
      await fetchWithAuth(`/api/tasks/sub-tasks/${id}/pause`, { method: "PUT" });
      setIsRunning(false);
    } catch (err) {
      console.error("Failed to auto-pause task:", err);
    }
  };

  const resumeTask = async () => {
    try {
      if (isBreak) {
        setIsRunning(true);
      } else {
        await fetchWithAuth(`/api/tasks/sub-tasks/${id}/resume`, { method: "PUT" });
        setIsRunning(true);
      }
    } catch (err) {
      console.error("Failed to resume task:", err);
    }
  };

  const finishTask = async () => {
    try {
      await fetchWithAuth(`/api/tasks/sub-tasks/${id}/finish`, { method: "PUT" });
      setIsRunning(false);
      localStorage.removeItem("pomodoroState"); // Clear saved state when finishing
      Navigate("/");
    } catch (err) {
      console.error("Failed to finish task:", err);
    }
  };

  const pauseBreak = () => {
    setIsRunning(false);
  };

  const resumeBreak = () => {
    setIsRunning(true);
  };

  const handleTimerEnd = async () => {
    setIsRunning(false); // Ensure timer stops immediately

    if (isBreak) {
      // End of break period
      setIsBreak(false);
      setTime(WORK_TIME);
      setTotalTime(WORK_TIME);
      await resumeTask();
    } else {
      // End of work period
      const newCount = pomodoroCount + 1;
      setPomodoroCount(newCount);
      
      // Determine break duration
      const breakDuration = newCount % LONG_BREAK_THRESHOLD === 0 ? LONG_BREAK : SHORT_BREAK;
      setTime(breakDuration);
      setTotalTime(breakDuration);
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
    <Paper
      elevation={6}
      sx={{
        maxWidth: 600,
        mx: "auto",
        mt: 4,
        p: 4,
        textAlign: "center",
        borderRadius: 4,
        backgroundColor: isBreak ? "#f3f4f6" : "#fff",
      }}
    >
      <Typography variant="h4" sx={{ mb: 2, fontWeight: "bold" }}>
        {isBreak
          ? pomodoroCount % LONG_BREAK_THRESHOLD === 0
            ? "Long Break"
            : "Short Break"
          : "Work Time"}
      </Typography>
      <Box sx={{ position: "relative", display: "flex", justifyContent: "center", alignItems: "center", my: 3 }}>
        <Box sx={{ position: "relative", width: 200, height: 200 }}>
          <CircularProgress
            variant="determinate"
            value={calculateProgress()}
            size={200}
            thickness={6}
            color={isBreak ? "success" : "primary"}
            sx={{ position: "absolute", left: 0, animation: "progress 1s ease-in-out" }}
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
            <Typography
              variant="h2"
              sx={{ fontWeight: "bold", color: isBreak ? "#2e7d32" : "#1976d2" }}
            >
              {formatTime(time)}
            </Typography>
          </Box>
        </Box>
      </Box>
      <Box sx={{ display: "flex", justifyContent: "center", gap: 2 }}>
        {!isStarted && (
          <Button
            variant="contained"
            color="primary"
            onClick={startTask}
            disabled={isRunning}
            sx={{ px: 4, py: 1 }}
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
              sx={{ px: 4, py: 1 }}
            >
              Pause Work
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={resumeTask}
              disabled={isRunning}
              sx={{ px: 4, py: 1 }}
            >
              Resume Work
            </Button>
          </>
        )}
        {isStarted && (
                  <Button
                  variant="contained"
                  color="primary"
                  onClick={finishTask}
                  disabled={isRunning}
                  sx={{ px: 4, py: 1 }}
                >
                  Finish Task
                </Button>
        )}
        {isStarted && isBreak && (
          <>
            <Button
              variant="contained"
              color="secondary"
              onClick={pauseBreak}
              disabled={!isRunning}
              sx={{ px: 4, py: 1 }}
            >
              Pause Break
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={resumeBreak}
              disabled={isRunning}
              sx={{ px: 4, py: 1 }}
            >
              Resume Break
            </Button>
          </>
        )}
      </Box>
      <Typography variant="body1" sx={{ mt: 3, color: "#757575" }}>
        Pomodoro Cycles Completed:{" "}
        <Typography component="span" color="primary" fontWeight="bold">
          {pomodoroCount}
        </Typography>
      </Typography>
    </Paper>
  );
};

export default PomodoroTimerForSubTasks;