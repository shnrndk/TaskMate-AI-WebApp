import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { fetchWithAuth } from "../utils/api";
import Countdown from 'react-countdown';
import {
  Box,
  Typography,
  Button,
  Paper,
} from "@mui/material";

const PomodoroTimer = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // Constants
  const WORK_TIME = 25 * 60/60 * 1000; // Convert to milliseconds
  const SHORT_BREAK = 5 * 60/60 * 1000;
  const LONG_BREAK = 15 * 60/60 * 1000;
  const LONG_BREAK_THRESHOLD = 4;

  // State
  const [endTime, setEndTime] = useState(Date.now() + WORK_TIME);
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [pomodoroCount, setPomodoroCount] = useState(0);
  const [isStarted, setIsStarted] = useState(false);
  const [totalTime, setTotalTime] = useState(WORK_TIME);
  const [key, setKey] = useState(0); // Add key for forcing Countdown remount
  
  const countdownRef = useRef();

  // Load initial state
  useEffect(() => {
    checkTaskStatus();
    
    // Load saved state from localStorage
    const savedState = localStorage.getItem("pomodoroState");
    if (savedState) {
      const { count, isBreakSaved, lastEndTime } = JSON.parse(savedState);
      setPomodoroCount(count);
      setIsBreak(isBreakSaved);
      if (lastEndTime) {
        setEndTime(lastEndTime);
        setTotalTime(isBreakSaved ? 
          (count % LONG_BREAK_THRESHOLD === 0 ? LONG_BREAK : SHORT_BREAK) : 
          WORK_TIME
        );
      }
    }
  }, []);

  // Save state on changes
  useEffect(() => {
    localStorage.setItem("pomodoroState", JSON.stringify({
      count: pomodoroCount,
      isBreakSaved: isBreak,
      lastEndTime: endTime
    }));
  }, [pomodoroCount, isBreak, endTime]);

  const checkTaskStatus = async () => {
    try {
      const response = await fetchWithAuth(`/api/tasks/${id}/status`);
      if (response.ok) {
        const data = await response.json();
        setIsStarted(data.isStarted);
        setIsRunning(data.isStarted);
      }
    } catch (err) {
      console.error("Error checking task status:", err);
    }
  };

  const startTask = async () => {
    try {
      await fetchWithAuth(`/api/tasks/${id}/start`, { method: "PUT" });
      const newEndTime = Date.now() + WORK_TIME;
      setEndTime(newEndTime);
      setTotalTime(WORK_TIME);
      setIsRunning(true);
      setIsStarted(true);
      setIsBreak(false);
      setKey(prev => prev + 1); // Force Countdown remount
    } catch (err) {
      console.error("Failed to start task:", err);
    }
  };

  const pauseTimer = async () => {
    try {
      if (!isBreak) {
        await fetchWithAuth(`/api/tasks/${id}/pause`, { method: "PUT" });
      }
      setIsRunning(false);
      if (countdownRef.current) {
        countdownRef.current.pause();
      }
    } catch (err) {
      console.error("Failed to pause:", err);
    }
  };

  const resumeTimer = async (breakStatus) => {
    try {
      if (!breakStatus || !isBreak) {
        await fetchWithAuth(`/api/tasks/${id}/resume`, { method: "PUT" });
      }
      setIsRunning(true);
      if (countdownRef.current) {
        countdownRef.current.start();
      }
    } catch (err) {
      console.error("Failed to resume:", err);
    }
  };

  const finishTask = async () => {
    try {
      if (!isRunning) {
        await fetchWithAuth(`/api/tasks/${id}/finish`, { method: "PUT" });
        localStorage.removeItem("pomodoroState");
        navigate("/");
      }
    } catch (err) {
      console.error("Failed to finish task:", err);
    }
  };

  const handleTimerComplete = async () => {
    setIsRunning(false);
    
    if (isBreak) {
      // Switch to work period
      setIsBreak(false);
      const newEndTime = Date.now() + WORK_TIME;
      setEndTime(newEndTime);
      setTotalTime(WORK_TIME);
      setKey(prev => prev + 1); // Force Countdown remount
      await resumeTimer(false);
    } else {
      // Switch to break period
      const newCount = pomodoroCount + 1;
      setPomodoroCount(newCount);
      
      const breakDuration = newCount % LONG_BREAK_THRESHOLD === 0 ? LONG_BREAK : SHORT_BREAK;
      const newEndTime = Date.now() + breakDuration;
      setEndTime(newEndTime);
      setTotalTime(breakDuration);
      setIsBreak(true);
      setKey(prev => prev + 1); // Force Countdown remount
      await pauseTimer();
    }
  };

  const renderer = ({ minutes, seconds, completed }) => {
    if (completed) return null;

    const elapsed = totalTime - ((minutes * 60 + seconds) * 1000);
    const progress = (elapsed / totalTime) * 100;

    return (
      <Box sx={{ position: "relative", display: "flex", justifyContent: "center", alignItems: "center", my: 3 }}>
        <Box sx={{ position: "relative", width: 200, height: 200 }}>
          <svg width="200" height="200" style={{ transform: 'rotate(-90deg)' }}>
            <circle
              cx="100"
              cy="100"
              r="70"
              stroke="#e0e0e0"
              strokeWidth="12"
              fill="none"
            />
            <circle
              cx="100"
              cy="100"
              r="70"
              stroke={isBreak ? "#4caf50" : "#1976d2"}
              strokeWidth="12"
              fill="none"
              strokeDasharray="440"
              strokeDashoffset={440 - (440 * progress) / 100}
              style={{ transition: 'stroke-dashoffset 0.5s linear' }}
            />
          </svg>
          <Box
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              bottom: 0,
              right: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Typography
              variant="h2"
              sx={{ 
                fontWeight: "bold", 
                color: isBreak ? "#2e7d32" : "#1976d2"
              }}
            >
              {`${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`}
            </Typography>
          </Box>
        </Box>
      </Box>
    );
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

      <Countdown
        ref={countdownRef}
        date={endTime}
        renderer={renderer}
        onComplete={handleTimerComplete}
        autoStart={isRunning}
        key={key}
      />
      
      <Box sx={{ display: "flex", justifyContent: "center", gap: 2 }}>
        {!isStarted ? (
          <Button
            variant="contained"
            color="primary"
            onClick={startTask}
            disabled={isRunning}
            sx={{ px: 4, py: 1 }}
          >
            Start Task
          </Button>
        ) : (
          <>
            <Button
              variant="contained"
              color="secondary"
              onClick={pauseTimer}
              disabled={!isRunning}
              sx={{ px: 4, py: 1 }}
            >
              Pause {isBreak ? 'Break' : 'Work'}
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={() => resumeTimer(true)}
              disabled={isRunning}
              sx={{ px: 4, py: 1 }}
            >
              Resume {isBreak ? 'Break' : 'Work'}
            </Button>
            <Button
              variant="contained"
              color="error"
              onClick={finishTask}
              disabled={isRunning}
              sx={{ px: 4, py: 1 }}
            >
              Finish Task
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

export default PomodoroTimer;