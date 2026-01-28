import React, { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
} from 'chart.js';
import { useParams } from 'react-router-dom';
import { Doughnut, Bar, Line } from 'react-chartjs-2';
import { fetchWithAuth } from '../../utils/api';
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material'; // Import MUI components

// Register ChartJS components
ChartJS.register(
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

// Helper Components (Modified for A11y)
const StatCard = ({ label, value, colorClass }) => (
  <div 
    className={`${colorClass} p-4 rounded-lg text-center`}
    role="status" // Indicates this element provides status information
    aria-label={`${label}: ${value}`}
  >
    <p className="text-sm font-medium">{label}</p>
    <p className="text-lg font-bold mt-1">{value}</p>
  </div>
);

const ChartCard = ({ title, children, data, chartType }) => (
  <div className="bg-gray-50 rounded-lg p-4">
    <h4 
      className="text-sm font-medium text-gray-700 mb-4 text-center"
      id={`chart-title-${title.toLowerCase().replace(/\s/g, '-')}`}
    >
      {title}
    </h4>
    {/* The chart visualization is hidden from screen readers, who rely on the table */}
    <div 
      className="h-64" 
      aria-hidden="true" 
      role="presentation"
    >
      {children}
    </div>
    
    {/* Accessible Data Table for the Chart */}
    <AccessibleChartTable title={title} data={data} chartType={chartType} />
  </div>
);

// 🔹 NEW: Component to render accessible data tables for each chart
const AccessibleChartTable = ({ title, data, chartType }) => {
    if (!data) return null;

    const getTimeInHours = (seconds) => (seconds / 3600).toFixed(2);
    
    let tableContent;

    if (chartType === 'doughnut') {
        // Efficiency Score Data Table
        tableContent = (
            <Table size="small" aria-label={`Data table for ${title}`}>
                <TableHead>
                    <TableRow>
                        <TableCell>Metric</TableCell>
                        <TableCell align="right">Percentage (%)</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    <TableRow>
                        <TableCell>Efficiency Score</TableCell>
                        <TableCell align="right">{data.datasets[0].data[0]}</TableCell>
                    </TableRow>
                </TableBody>
            </Table>
        );
    } else if (chartType === 'bar-time') {
        // Time Distribution Data Table
        tableContent = (
            <Table size="small" aria-label={`Data table for ${title}`}>
                <TableHead>
                    <TableRow>
                        <TableCell>Time Type</TableCell>
                        <TableCell align="right">Duration (Hours)</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {data.labels.map((label, index) => (
                        <TableRow key={label}>
                            <TableCell>{label}</TableCell>
                            <TableCell align="right">{getTimeInHours(data.datasets[0].data[index])}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        );
    } else if (chartType === 'line') {
        // Session Trends Data Table
        tableContent = (
            <Table size="small" aria-label={`Data table for ${title}`}>
                <TableHead>
                    <TableRow>
                        <TableCell>Session</TableCell>
                        <TableCell align="right">Work Duration (Hours)</TableCell>
                        <TableCell align="right">Break Duration (Hours)</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {data.labels.map((label, index) => (
                        <TableRow key={label}>
                            <TableCell>{label}</TableCell>
                            <TableCell align="right">{getTimeInHours(data.datasets[0].data[index])}</TableCell>
                            <TableCell align="right">{getTimeInHours(data.datasets[1].data[index])}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        );
    } else if (chartType === 'bar-pomodoro') {
        // Pomodoro Cycles Data Table
        tableContent = (
            <Table size="small" aria-label={`Data table for ${title}`}>
                <TableHead>
                    <TableRow>
                        <TableCell>Session</TableCell>
                        <TableCell align="right">Cycles</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {data.labels.map((label, index) => (
                        <TableRow key={label}>
                            <TableCell>{label}</TableCell>
                            <TableCell align="right">{data.datasets[0].data[index]}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        );
    }

    return (
        <TableContainer component={Paper} sx={{ mt: 2 }} role="region" aria-label={`Data for ${title} chart.`}>
            {tableContent}
        </TableContainer>
    );
};


const TaskStatsCharts = () => {
  const { taskId } = useParams();
  const [taskData, setTaskData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // 🔹 NEW: ARIA Live Region State
  const [liveMessage, setLiveMessage] = useState("Loading task statistics dashboard.");

  useEffect(() => {
    const fetchTaskStats = async () => {
      try {
        setLoading(true);
        setError(null);
        setLiveMessage("Fetching task data...");

        const response = await fetchWithAuth(`/api/productivity-data/${taskId}/stats`);
        if (!response.ok) {
          throw new Error(`Error fetching task stats: ${response.statusText}`);
        }

        const data = await response.json();
        setTaskData(data);
        setLiveMessage(`Statistics loaded for task: ${data.task.title}.`);
      } catch (err) {
        setError(err.message);
        setLiveMessage(`Error loading task data: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    if (taskId) {
      fetchTaskStats();
    }
  }, [taskId]);

  if (loading) {
    return <div className="h-32 flex items-center justify-center" aria-live="assertive">Loading task stats...</div>;
  }

  if (error) {
    return <div className="h-32 flex items-center justify-center text-red-600" role="alert">Error: {error}</div>;
  }

  if (!taskData?.task || !taskData?.stats) {
    return <div className="h-32 flex items-center justify-center" role="alert">No task stats available.</div>;
  }

  const { task, stats } = taskData;

  // Ensure all required stats properties exist with default values
  const safeStats = {
    // Convert percentage to 0-100 scale for Doughnut chart
    efficiencyScore: (stats.efficiencyScore * 10).toFixed(0) || 0, 
    totalWorkDuration: stats.totalWorkDuration || 0, // seconds
    totalBreakDuration: stats.totalBreakDuration || 0, // seconds
    totalPausedDuration: stats.totalPausedDuration || 0, // seconds
    totalSessions: stats.totalSessions || 0,
    totalPomodoroCycles: stats.totalPomodoroCycles || 0,
    // Convert total time spent to a readable hour format for display
    totalTimeSpent: (stats.totalTimeSpent / 3600).toFixed(2), 
    sessions: stats.sessions || [],
  };

  // Chart Data Configurations
  const efficiencyData = {
    labels: ['Efficiency', 'Remaining'],
    datasets: [
      {
        data: [parseFloat(safeStats.efficiencyScore), 100 - parseFloat(safeStats.efficiencyScore)],
        backgroundColor: ['rgb(76, 175, 80)', 'rgb(224, 224, 224)'],
        hoverBackgroundColor: ['rgb(76, 175, 80)', 'rgb(224, 224, 224)'],
      },
    ],
  };

  const timeDistributionData = {
    labels: ['Work', 'Break', 'Paused'],
    datasets: [
      {
        label: 'Duration (Seconds)',
        data: [
          parseFloat(safeStats.totalWorkDuration),
          parseFloat(safeStats.totalBreakDuration),
          parseFloat(safeStats.totalPausedDuration),
        ],
        backgroundColor: ['rgb(75, 192, 192)', 'rgb(153, 102, 255)', 'rgb(255, 159, 64)'],
        borderColor: ['rgb(75, 192, 192)', 'rgb(153, 102, 255)', 'rgb(255, 159, 64)'],
        borderWidth: 1,
      },
    ],
  };

  const sessionTrendsData = {
    labels: safeStats.sessions.map((_, index) => `Session ${index + 1}`),
    datasets: [
      {
        label: 'Work Duration (Seconds)',
        data: safeStats.sessions.map((session) => session?.workDuration || 0),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.4,
        fill: true,
      },
      {
        label: 'Break Duration (Seconds)',
        data: safeStats.sessions.map((session) => session?.breakDuration || 0),
        borderColor: 'rgb(153, 102, 255)',
        backgroundColor: 'rgba(153, 102, 255, 0.2)',
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const pomodoroData = {
    labels: safeStats.sessions.map((_, index) => `Session ${index + 1}`),
    datasets: [
      {
        label: 'Pomodoro Cycles',
        data: safeStats.sessions.map((session) => session?.pomodoroCycles || 0),
        backgroundColor: 'rgb(255, 99, 132)',
        borderColor: 'rgb(255, 99, 132)',
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      {/* 1. ARIA Live Region for global state announcements */}
      <Box 
        aria-live="assertive" 
        sx={{ position: 'absolute', clip: 'rect(0 0 0 0)', width: 1, height: 1, margin: -1, padding: 0, overflow: 'hidden' }}
      >
        {liveMessage}
      </Box>

      <div className="bg-white rounded-lg shadow p-6" role="main" aria-labelledby="task-stats-main-heading">
        {/* Task Header */}
        <div className="border-b pb-4 mb-6">
          <h1 className="text-xl font-bold text-gray-800" id="task-stats-main-heading">
            Statistics Dashboard for: {task.title || 'Untitled Task'}
          </h1>
          <p className="text-sm text-gray-600 mt-2">{task.description || 'No description available'}</p>
          <div className="flex flex-wrap gap-2 mt-3" role="list" aria-label="Task Metadata">
            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm" role="listitem">
              **Priority:** {task.priority || 'No'}
            </span>
            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm" role="listitem">
              **Status:** {task.status || 'Unknown'}
            </span>
            <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm" role="listitem">
              **Category:** {task.category || 'Uncategorized'}
            </span>
          </div>
        </div>

        {/* 2. Stats Grid - Presented as a list of statuses */}
        <div 
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6" 
          role="list" 
          aria-label="Key Performance Indicators"
        >
          <StatCard label="Total Sessions" value={safeStats.totalSessions} colorClass="bg-blue-100 text-blue-800" />
          <StatCard
            label="Total Pomodoro Cycles"
            value={safeStats.totalPomodoroCycles}
            colorClass="bg-green-100 text-green-800"
          />
          <StatCard
            label="Total Time Spent (Hours)"
            value={`${safeStats.totalTimeSpent}h`}
            colorClass="bg-purple-100 text-purple-800"
          />
          <StatCard
            label="Efficiency Score (0-100)"
            value={`${safeStats.efficiencyScore}%`}
            colorClass="bg-orange-100 text-orange-800"
          />
        </div>

        {/* 3. Charts Grid - Explicitly labeled regions */}
        <div 
          className="grid md:grid-cols-2 gap-6" 
          role="region" 
          aria-label="Task Data Visualizations and Tables"
        >
          <ChartCard title="Efficiency Score" data={efficiencyData} chartType="doughnut">
            <div className="h-64">
              <Doughnut
                data={efficiencyData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  cutout: '70%',
                  plugins: {
                    legend: { display: false },
                    tooltip: { callbacks: { label: (context) => `${context.formattedValue}%` } },
                  },
                }}
              />
            </div>
          </ChartCard>

          <ChartCard title="Time Distribution" data={timeDistributionData} chartType="bar-time">
            <div className="h-64">
              <Bar
                data={timeDistributionData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { position: 'bottom' },
                  },
                  scales: {
                    y: { 
                        beginAtZero: true, 
                        title: { display: true, text: 'Duration (Seconds)' } 
                    },
                  },
                }}
              />
            </div>
          </ChartCard>

          <ChartCard title="Session Trends" data={sessionTrendsData} chartType="line">
            <div className="h-64">
              <Line
                data={sessionTrendsData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { position: 'bottom' },
                  },
                  scales: {
                    y: { 
                        beginAtZero: true, 
                        title: { display: true, text: 'Duration (Seconds)' }
                    },
                  },
                }}
              />
            </div>
          </ChartCard>

          <ChartCard title="Pomodoro Cycles" data={pomodoroData} chartType="bar-pomodoro">
            <div className="h-64">
              <Bar
                data={pomodoroData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { position: 'bottom' },
                  },
                  scales: {
                    y: { 
                        beginAtZero: true, 
                        title: { display: true, text: 'Pomodoro Cycles' } 
                    },
                  },
                }}
              />
            </div>
          </ChartCard>
        </div>
      </div>
    </div>
  );
};

export default TaskStatsCharts;