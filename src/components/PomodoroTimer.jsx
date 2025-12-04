import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { fetchWithAuth } from "../utils/api";
import Countdown from 'react-countdown';
import {
  Box,
  Typography,
  Button,
  Paper,
  IconButton, // Use IconButton for the mute button
  Tooltip, // Add Tooltip for clearer mute button label
} from "@mui/material";

const PomodoroTimer = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // Constants
  const WORK_TIME = 25 * 60 * 1000; // 25 minutes in milliseconds
  const SHORT_BREAK = 5 * 60 * 1000; // 5 minutes
  const LONG_BREAK = 15 * 60 * 1000; // 15 minutes
  const LONG_BREAK_THRESHOLD = 4;

  // State
  const [endTime, setEndTime] = useState(Date.now() + WORK_TIME);
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [pomodoroCount, setPomodoroCount] = useState(0);
  const [isStarted, setIsStarted] = useState(false);
  const [totalTime, setTotalTime] = useState(WORK_TIME);
  const [key, setKey] = useState(0); // Key for forcing Countdown remount
  const [liveMessage, setLiveMessage] = useState(""); // ARIA Live Region State
  
  const countdownRef = useRef();

  // Audio Refs and State
  const workCompleteSound = useRef(new Audio("/sounds/work-complete.mp3"));
  const breakCompleteSound = useRef(new Audio("/sounds/break-complete.mp3"));
  const [isMuted, setIsMuted] = useState(false);

  // Initialize audio settings & Check for task status
  useEffect(() => {
    // Audio configuration (removed from original useEffect for cleaner separation)
    const muteSetting = localStorage.getItem("pomodoroMuted");
    setIsMuted(muteSetting === "true");
    workCompleteSound.current.preload = "auto";
    breakCompleteSound.current.preload = "auto";
    
    checkTaskStatus(); // Load initial state (moved up for clarity)

    return () => {
      workCompleteSound.current.pause();
      breakCompleteSound.current.pause();
    };
  }, [id]); // Depend on 'id' for task status check

  // Update audio mute states when isMuted changes
  useEffect(() => {
    workCompleteSound.current.muted = isMuted;
    breakCompleteSound.current.muted = isMuted;
    localStorage.setItem("pomodoroMuted", isMuted);
  }, [isMuted]);

  // Audio playback logic
  const playSound = async (isBreakTime) => {
    try {
      const sound = isBreakTime ? workCompleteSound.current : breakCompleteSound.current;
      sound.currentTime = 0;
      await sound.play().catch(error => {
        console.error("Error playing sound:", error);
      });
    } catch (error) {
      console.error("Error with sound playback:", error);
    }
  };

  // Load initial state (updated from original structure)
  useEffect(() => {
    const savedState = localStorage.getItem("pomodoroState");
    if (savedState) {
      const parsedState = JSON.parse(savedState);
      
      if (parsedState.taskId === id) {
        const {
          count,
          isBreakSaved,
          lastEndTime,
          lastUpdated,
          isStartedSaved,
          totalTimeValue
        } = parsedState;

        // Check if the saved state is still valid (24 hours)
        const stateAge = Date.now() - lastUpdated;
        if (stateAge < 24 * 60 * 60 * 1000) { 
          setPomodoroCount(count);
          setIsBreak(isBreakSaved);
          setIsStarted(isStartedSaved);
          setTotalTime(totalTimeValue);
          
          let effectiveEndTime = lastEndTime;
          if (lastEndTime <= Date.now() && isStartedSaved) {
             // If timer finished while component was unmounted/inactive, transition to next phase
             setLiveMessage(`The previous ${isBreakSaved ? 'break' : 'work'} session has ended. Please start the next phase.`);
             setIsRunning(false); // Should be paused if end time passed
             return; // Stop restoring running state
          } else if (lastEndTime > Date.now()) {
            // Restore ongoing session
            setEndTime(lastEndTime);
            if (isStartedSaved) {
              // Only set running if it was started, and we handle the pause/resume externally
              // We rely on checkTaskStatus for the *true* running state if integrated with backend
              setIsRunning(true); 
            }
          }
        } else {
          localStorage.removeItem("pomodoroState");
        }
      }
    }
  }, [id]);

  // Save state on changes
  useEffect(() => {
    // Announce phase change for screen readers
    const phaseName = isBreak 
      ? (pomodoroCount % LONG_BREAK_THRESHOLD === 0 ? "Long Break" : "Short Break")
      : "Work Time";
    
    // Announce if it's the start of a phase AND the timer is running
    if (isRunning && isStarted) {
      setLiveMessage(`${phaseName} has started. ${isBreak ? 'Time to relax.' : 'Focus now.'}`);
    } else if (isStarted) {
      setLiveMessage(`${phaseName} is ready to start or resume.`);
    }

    localStorage.setItem("pomodoroState", JSON.stringify({
      taskId: id,
      count: pomodoroCount,
      isBreakSaved: isBreak,
      lastEndTime: endTime,
      lastUpdated: Date.now(),
      isStartedSaved: isStarted,
      totalTimeValue: totalTime,
      // ... (other optional data)
    }));
  }, [pomodoroCount, isBreak, endTime, isStarted, totalTime, id, isRunning]);

  const checkTaskStatus = async () => {
    // ... (logic remains the same)
    try {
      const response = await fetchWithAuth(`/api/tasks/${id}/status`);
      if (response.ok) {
        const data = await response.json();
        setIsStarted(data.isStarted);
        // Important: Only override isRunning if the task *has* started
        if (data.isStarted) {
          setIsRunning(data.isRunning); // Assuming backend returns isRunning state
        }
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
      setLiveMessage("Task started. Work time has begun."); // ARIA announcement
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
      setLiveMessage(`${isBreak ? 'Break' : 'Work'} timer paused.`); // ARIA announcement
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
      setLiveMessage(`${isBreak ? 'Break' : 'Work'} timer resumed.`); // ARIA announcement
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
        setLiveMessage("Task successfully finished and navigated to home."); // ARIA announcement
      } else {
        setLiveMessage("Cannot finish task while the timer is running. Please pause first."); // ARIA announcement
      }
    } catch (err) {
      console.error("Failed to finish task:", err);
    }
  };

  const handleTimerComplete = async () => {
    setIsRunning(false);
    
    if (isBreak) {
      // Switch to work period
      await playSound(true);
      const newEndTime = Date.now() + WORK_TIME;
      setEndTime(newEndTime);
      setTotalTime(WORK_TIME);
      setIsBreak(false); // State change triggers phase announcement in useEffect
      setKey(prev => prev + 1); // Force Countdown remount
      // Automatically resume work after break
      await resumeTimer(false); 
      setLiveMessage(`Break time is over. Starting work session number ${pomodoroCount + 1}.`);
    } else {
      // Switch to break period
      await playSound(false);
      const newCount = pomodoroCount + 1;
      setPomodoroCount(newCount);
      
      const breakDuration = newCount % LONG_BREAK_THRESHOLD === 0 ? LONG_BREAK : SHORT_BREAK;
      const newEndTime = Date.now() + breakDuration;
      setEndTime(newEndTime);
      setTotalTime(breakDuration);
      setIsBreak(true); // State change triggers phase announcement in useEffect
      setKey(prev => prev + 1); // Force Countdown remount
      // Pause after work, allowing user to take an actual break before resuming.
      await pauseTimer();
      const breakType = breakDuration === LONG_BREAK ? 'Long Break' : 'Short Break';
      setLiveMessage(`Work session complete! Starting a ${breakType}. Timer is paused.`);
    }
  };

  // --- Accessibility Improvement for Timer Display ---
  const getPhaseText = () => {
    return isBreak
      ? pomodoroCount % LONG_BREAK_THRESHOLD === 0
        ? "Long Break"
        : "Short Break"
      : "Work Time";
  };
  
  // Renderer with ARIA-hidden for visual elements
  const renderer = ({ minutes, seconds, completed }) => {
    if (completed) return null;

    const elapsed = totalTime - ((minutes * 60 + seconds) * 1000);
    const progress = (elapsed / totalTime) * 100;
    
    // Format time for screen reader announcement (e.g., "25 minutes 0 seconds")
    const timeAnnouncement = `${minutes} minutes and ${seconds} seconds remaining.`;

    return (
      <Box 
        sx={{ position: "relative", display: "flex", justifyContent: "center", alignItems: "center", my: 3 }}
        // ARIA Live region to announce the remaining time on the screen
        role="timer"
        aria-label={`${getPhaseText()} timer. Time remaining: ${timeAnnouncement}`}
      >
        {/* Visual Timer - Hidden from screen readers */}
        <Box sx={{ position: "relative", width: 200, height: 200 }} aria-hidden="true"> 
          <svg width="200" height="200" style={{ transform: 'rotate(-90deg)' }}>
            {/* ... (SVG circles for progress bar) ... */}
            <circle cx="100" cy="100" r="70" stroke="#e0e0e0" strokeWidth="12" fill="none" />
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
            {/* The time display is visible but aria-hidden because the parent role="timer" handles the announcement */}
            <Typography
              variant="h2"
              sx={{ 
                fontWeight: "bold", 
                color: isBreak ? "#2e7d32" : "#1976d2"
              }}
              aria-hidden="true" 
            >
              {`${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`}
            </Typography>
          </Box>
        </Box>
        
        {/* Hidden text for screen readers, only announces every 5 seconds or major events */}
        <Typography 
          sx={{ position: 'absolute', clip: 'rect(0 0 0 0)', width: 1, height: 1, margin: -1, padding: 0, overflow: 'hidden' }}
          aria-live="polite"
        >
          {/* Announce time only for every full minute or when seconds is a multiple of 5 for smoother listening */}
          {(seconds === 0 || seconds % 5 === 0) && timeAnnouncement}
        </Typography>
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
      // Role main for primary content
      role="main" 
    >
      {/* 1. Use <h1> for the primary status/title */}
      <Typography variant="h4" component="h1" sx={{ mb: 2, fontWeight: "bold" }}>
        {getPhaseText()}
      </Typography>
      
      {/* 2. ARIA Live Region for dynamic announcements (e.g., timer completion, phase change) */}
      <Box 
        aria-live="assertive" 
        sx={{ position: 'absolute', clip: 'rect(0 0 0 0)', width: 1, height: 1, margin: -1, padding: 0, overflow: 'hidden' }}
      >
        {liveMessage}
      </Box>

      {/* Countdown component uses the updated renderer */}
      <Countdown
        ref={countdownRef}
        date={endTime}
        renderer={renderer}
        onComplete={handleTimerComplete}
        autoStart={isRunning}
        key={key}
      />
      
      {/* Control Buttons */}
      <Box sx={{ display: "flex", justifyContent: "center", gap: 2 }}>
        {!isStarted ? (
          <Button
            variant="contained"
            color="primary"
            onClick={startTask}
            disabled={isRunning}
            sx={{ px: 4, py: 1 }}
            // 3. Add explicit labels for clarity
            aria-label="Start Pomodoro Task" 
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
              aria-label={`Pause the current ${isBreak ? 'Break' : 'Work'} session`}
            >
              Pause {isBreak ? 'Break' : 'Work'}
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={() => resumeTimer(true)}
              disabled={isRunning}
              sx={{ px: 4, py: 1 }}
              aria-label={`Resume the current ${isBreak ? 'Break' : 'Work'} session`}
            >
              Resume {isBreak ? 'Break' : 'Work'}
            </Button>
            <Button
              variant="contained"
              color="error"
              onClick={finishTask}
              disabled={isRunning}
              sx={{ px: 4, py: 1 }}
              aria-label="Finish and close the Pomodoro Task"
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
      
      {/* Mute Button with Tooltip and IconButton */}
      <Box sx={{ display: "flex", justifyContent: "center", mt: 2, mb: 2 }}>
        <Tooltip title={isMuted ? "Unmute Notifications" : "Mute Notifications"}>
          <IconButton
            variant="outlined"
            color={isMuted ? "error" : "primary"}
            onClick={() => setIsMuted(!isMuted)}
            sx={{ minWidth: 40, width: 40, height: 40, p: 0 }}
            aria-label={isMuted ? "Unmute sound notifications" : "Mute sound notifications"}
          >
            {isMuted ? "🔇" : "🔊"}
          </IconButton>
        </Tooltip>
      </Box>
    </Paper>
  );
};

export default PomodoroTimer;