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
  const Navigate = useNavigate();
  
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
      await fetchWithAuth(`/api/tasks/sub-tasks/${id}/start`, { method: "PUT" });
      setIsRunning(true);
      setIsStarted(true);
      setTotalTime(WORK_TIME);
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
      await fetchWithAuth(`/api/tasks/sub-tasks/${id}/resume`, { method: "PUT" });
      setIsRunning(true);
    } catch (err) {
      console.error("Failed to resume task:", err);
    }
  };

    const finishTask = async () => {
        try {
            await fetchWithAuth(`/api/tasks/${id}/finish`, { method: "PUT" });
            setIsRunning(false);
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