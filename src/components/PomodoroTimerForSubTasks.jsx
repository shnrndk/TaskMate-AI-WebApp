import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
  const Navigate = useNavigate();
  
  // Constants (in seconds)
  const WORK_TIME = 25 * 60;
  const SHORT_BREAK = 5 * 60;
  const LONG_BREAK = 15 * 60;
  const LONG_BREAK_THRESHOLD = 4;

  // State
  const [time, setTime] = useState(WORK_TIME);
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [pomodoroCount, setPomodoroCount] = useState(0);
  const [totalTime, setTotalTime] = useState(WORK_TIME);
  const [isStarted, setIsStarted] = useState(false);
  const [lastTimestamp, setLastTimestamp] = useState(null);
  
  // ARIA Live Region State
  const [liveMessage, setLiveMessage] = useState(""); 
  
  // Ref to track whether the timer is actively running, for the tick function
  const isRunningRef = useRef(isRunning); 
  isRunningRef.current = isRunning;
  
  // Ref to prevent multiple handleTimerEnd calls
  const isHandlingEndRef = useRef(false);

  // Helper to get the current phase name for announcements and display
  const getPhaseText = (isBreakPhase = isBreak, count = pomodoroCount) => {
    if (isBreakPhase) {
      return count % LONG_BREAK_THRESHOLD === 0 ? "Long Break" : "Short Break";
    }
    return "Work Time";
  };

  // --- Accessibility Improvement: Announce Phase Changes ---
  useEffect(() => {
    if (isStarted) {
      const phaseName = getPhaseText();
      let message;
      if (isRunning) {
        message = `${phaseName} has started or resumed.`;
      } else if (isBreak && !isRunning) {
        message = `${phaseName} is paused.`;
      } else if (!isBreak && !isRunning && time < totalTime) {
        message = `Work Time is paused.`;
      } else {
        message = `${phaseName} is ready.`;
      }
      setLiveMessage(message);
    }
  }, [isBreak, isRunning, isStarted, time, totalTime]);

  // Handle visibility change for background tab timing
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setLastTimestamp(Date.now());
      } else {
        if (lastTimestamp && isRunningRef.current) {
          const elapsedSeconds = Math.floor((Date.now() - lastTimestamp) / 1000);
          
          setTime(prevTime => {
            const newTime = Math.max(0, prevTime - elapsedSeconds);
            if (newTime === 0 && !isHandlingEndRef.current) {
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
  }, [lastTimestamp]); // Removed isRunning from dependency array, relying on isRunningRef

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
    checkTaskStatus(); // Check task status first

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

  // Save state periodically (60-second interval)
  useEffect(() => {
    const saveState = () => {
      if (!isRunningRef.current) return; // Only save if actively running
      const state = {
        taskId: id,
        time,
        isRunning: isRunningRef.current, // Use ref to get latest state in interval
        isBreak,
        pomodoroCount,
        totalTime,
      };
      localStorage.setItem("pomodoroState", JSON.stringify(state));
    };

    const interval = setInterval(saveState, 60000); // Save every minute

    // Initial save on run or on mount if running
    if (isRunning) saveState(); 

    return () => clearInterval(interval);
  }, [id, isBreak, pomodoroCount, totalTime]); // Removed time and isRunning to prevent re-initializing interval on every tick

  // Main timer logic using requestAnimationFrame
  useEffect(() => {
    let animationFrameId;
    let lastTick = Date.now();
    let secondsToSubtract = 0;

    const tick = () => {
      if (isRunningRef.current && !isHandlingEndRef.current) {
        const now = Date.now();
        const delta = now - lastTick;

        // Accumulate time passed
        secondsToSubtract += delta;

        // If at least one second has passed
        if (secondsToSubtract >= 1000) {
          const seconds = Math.floor(secondsToSubtract / 1000);
          
          setTime(prevTime => {
            const newTime = Math.max(0, prevTime - seconds);
            if (newTime === 0) {
              // Ensure we don't call handleTimerEnd multiple times in one tick
              if (!isHandlingEndRef.current) {
                 handleTimerEnd(); 
              }
            }
            return newTime;
          });
          
          // Reset the timestamp and carry over the remainder
          lastTick = now - (secondsToSubtract % 1000);
          secondsToSubtract = secondsToSubtract % 1000;
        }

        animationFrameId = requestAnimationFrame(tick);
      }
    };

    if (isRunning) {
      lastTick = Date.now();
      secondsToSubtract = 0;
      animationFrameId = requestAnimationFrame(tick);
    }

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [isRunning]); // Re-run effect when isRunning changes

  const startTask = async () => {
    try {
      await fetchWithAuth(`/api/tasks/sub-tasks/${id}/start`, { method: "PUT" });
      setIsRunning(true);
      setIsStarted(true);
      setTotalTime(WORK_TIME);
      setTime(WORK_TIME);
      setIsBreak(false);
      setLiveMessage("Task started. Work time has begun.");
    } catch (err) {
      console.error("Failed to start task:", err);
    }
  };

  const autoPauseTask = async () => {
    try {
      await fetchWithAuth(`/api/tasks/sub-tasks/${id}/pause`, { method: "PUT" });
      setIsRunning(false);
      setLiveMessage("Work timer paused.");
    } catch (err) {
      console.error("Failed to auto-pause task:", err);
    }
  };

  const resumeTask = async () => {
    try {
      if (isBreak) {
        setIsRunning(true);
        setLiveMessage("Break timer resumed.");
      } else {
        await fetchWithAuth(`/api/tasks/sub-tasks/${id}/resume`, { method: "PUT" });
        setIsRunning(true);
        setLiveMessage("Work timer resumed.");
      }
    } catch (err) {
      console.error("Failed to resume task:", err);
    }
  };

  const finishTask = async () => {
    try {
      await fetchWithAuth(`/api/tasks/sub-tasks/${id}/finish`, { method: "PUT" });
      setIsRunning(false);
      localStorage.removeItem("pomodoroState");
      setLiveMessage("Task successfully finished and navigating to home.");
      Navigate("/");
    } catch (err) {
      console.error("Failed to finish task:", err);
    }
  };

  const pauseBreak = () => {
    setIsRunning(false);
    setLiveMessage("Break timer paused.");
  };

  const resumeBreak = () => {
    setIsRunning(true);
    setLiveMessage("Break timer resumed.");
  };

  const handleTimerEnd = async () => {
    if (isHandlingEndRef.current) return;
    isHandlingEndRef.current = true;
    
    setIsRunning(false);

    if (isBreak) {
      // End of break period
      const newCount = pomodoroCount; // Use the current count
      setIsBreak(false);
      setTime(WORK_TIME);
      setTotalTime(WORK_TIME);
      await resumeTask();
      setLiveMessage(`Break time is over. Starting work session number ${newCount + 1}.`);
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
      const breakType = breakDuration === LONG_BREAK ? 'Long Break' : 'Short Break';
      setLiveMessage(`Work session complete! Starting a ${breakType}. Timer is paused.`);
    }

    // Allow new calls after a short delay
    setTimeout(() => {
      isHandlingEndRef.current = false;
    }, 500); 
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };
  
  const formatTimeForAria = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    
    if (minutes > 0) {
      return `${minutes} minutes and ${secs} seconds remaining.`;
    }
    return `${secs} seconds remaining.`;
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
      role="main"
    >
      {/* 1. Use <h1> for the primary status/title */}
      <Typography variant="h4" component="h1" sx={{ mb: 2, fontWeight: "bold" }}>
        {getPhaseText()}
      </Typography>

      {/* 2. ARIA Live Region for dynamic announcements */}
      <Box 
        aria-live="assertive" 
        sx={{ position: 'absolute', clip: 'rect(0 0 0 0)', width: 1, height: 1, margin: -1, padding: 0, overflow: 'hidden' }}
      >
        {liveMessage}
      </Box>

      {/* Timer Display Box with ARIA Timer Role */}
      <Box 
        sx={{ position: "relative", display: "flex", justifyContent: "center", alignItems: "center", my: 3 }}
        role="timer"
        aria-label={`${getPhaseText()} timer. Time remaining: ${formatTimeForAria(time)}`}
      >
        <Box sx={{ position: "relative", width: 200, height: 200 }} aria-hidden="true">
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
            {/* Time display marked aria-hidden since parent handles announcement */}
            <Typography
              variant="h2"
              sx={{ fontWeight: "bold", color: isBreak ? "#2e7d32" : "#1976d2" }}
              aria-hidden="true"
            >
              {formatTime(time)}
            </Typography>
          </Box>
        </Box>
        
        {/* Hidden text for screen readers (Polite for periodic time update) */}
        <Typography 
          sx={{ position: 'absolute', clip: 'rect(0 0 0 0)', width: 1, height: 1, margin: -1, padding: 0, overflow: 'hidden' }}
          aria-live="polite"
        >
          {/* Announce time only for every full minute or every 5 seconds */}
          {time % 60 === 0 || time % 5 === 0 ? formatTimeForAria(time) : ''}
        </Typography>
      </Box>

      {/* Control Buttons with ARIA Labels */}
      <Box sx={{ display: "flex", justifyContent: "center", gap: 2 }}>
        {!isStarted && (
          <Button
            variant="contained"
            color="primary"
            onClick={startTask}
            disabled={isRunning}
            sx={{ px: 4, py: 1 }}
            aria-label="Start Pomodoro Task: Begin the first work session"
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
              aria-label="Pause the current Work session"
            >
              Pause Work
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={resumeTask}
              disabled={isRunning}
              sx={{ px: 4, py: 1 }}
              aria-label="Resume the current Work session"
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
              sx={{ px: 4, py: 1 }}
              aria-label="Pause the current Break session"
            >
              Pause Break
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={resumeBreak}
              disabled={isRunning}
              sx={{ px: 4, py: 1 }}
              aria-label="Resume the current Break session"
            >
              Resume Break
            </Button>
          </>
        )}
        {isStarted && (
          <Button
            variant="contained"
            color="primary"
            onClick={finishTask}
            // Disabled when running to prevent accidental task completion
            disabled={isRunning} 
            sx={{ px: 4, py: 1 }}
            aria-label="Finish and complete the Pomodoro Task"
          >
            Finish Task
          </Button>
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