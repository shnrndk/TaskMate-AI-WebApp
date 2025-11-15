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

const TaskStatsCharts = () => {
  const { taskId } = useParams();
  const [taskData, setTaskData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTaskStats = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetchWithAuth(`/api/productivity-data/${taskId}/stats`);
        if (!response.ok) {
          throw new Error(`Error fetching task stats: ${response.statusText}`);
        }

        const data = await response.json();
        setTaskData(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (taskId) {
      fetchTaskStats();
    }
  }, [taskId]);

  if (loading) {
    return <div className="h-32 flex items-center justify-center">Loading task stats...</div>;
  }

  if (error) {
    return <div className="h-32 flex items-center justify-center text-red-600">Error: {error}</div>;
  }

  if (!taskData?.task || !taskData?.stats) {
    return <div className="h-32 flex items-center justify-center">No task stats available.</div>;
  }

  const { task, stats } = taskData;

  // Ensure all required stats properties exist with default values
  const safeStats = {
    efficiencyScore: stats.efficiencyScore || 0,
    totalWorkDuration: stats.totalWorkDuration || 0,
    totalBreakDuration: stats.totalBreakDuration || 0,
    totalPausedDuration: stats.totalPausedDuration || 0,
    totalSessions: stats.totalSessions || 0,
    totalPomodoroCycles: stats.totalPomodoroCycles || 0,
    totalTimeSpent: stats.totalTimeSpent || 0,
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
        label: 'Time Distribution',
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
        label: 'Work Duration',
        data: safeStats.sessions.map((session) => session?.workDuration || 0),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.4,
        fill: true,
      },
      {
        label: 'Break Duration',
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
      <div className="bg-white rounded-lg shadow p-6">
        {/* Task Header */}
        <div className="border-b pb-4 mb-6">
          <h3 className="text-lg font-semibold text-gray-800">{task.title || 'Untitled Task'}</h3>
          <p className="text-sm text-gray-600 mt-2">{task.description || 'No description available'}</p>
          <div className="flex flex-wrap gap-2 mt-3">
            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
              {task.priority || 'No'} Priority
            </span>
            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
              {task.status || 'Unknown Status'}
            </span>
            <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
              {task.category || 'Uncategorized'}
            </span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard label="Sessions" value={safeStats.totalSessions} colorClass="bg-blue-100 text-blue-800" />
          <StatCard
            label="Pomodoros"
            value={safeStats.totalPomodoroCycles}
            colorClass="bg-green-100 text-green-800"
          />
          <StatCard
            label="Time Spent"
            value={`${safeStats.totalTimeSpent}h`}
            colorClass="bg-purple-100 text-purple-800"
          />
          <StatCard
            label="Efficiency"
            value={`${safeStats.efficiencyScore}%`}
            colorClass="bg-orange-100 text-orange-800"
          />
        </div>

        {/* Charts Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          <ChartCard title="Efficiency Score">
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

          <ChartCard title="Time Distribution">
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
                    y: { beginAtZero: true },
                  },
                }}
              />
            </div>
          </ChartCard>

          <ChartCard title="Session Trends">
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
                    y: { beginAtZero: true },
                  },
                }}
              />
            </div>
          </ChartCard>

          <ChartCard title="Pomodoro Cycles">
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
                    y: { beginAtZero: true },
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

// Helper Components
const StatCard = ({ label, value, colorClass }) => (
  <div className={`${colorClass} p-4 rounded-lg text-center`}>
    <p className="text-sm font-medium">{label}</p>
    <p className="text-lg font-bold mt-1">{value}</p>
  </div>
);

const ChartCard = ({ title, children }) => (
  <div className="bg-gray-50 rounded-lg p-4">
    <h4 className="text-sm font-medium text-gray-700 mb-4 text-center">{title}</h4>
    {children}
  </div>
);

export default TaskStatsCharts;