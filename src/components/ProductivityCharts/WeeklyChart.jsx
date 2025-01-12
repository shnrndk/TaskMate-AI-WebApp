import React, { useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import { Box, Typography, Button, Stack } from '@mui/material';
import { format, startOfWeek, endOfWeek, subWeeks, addWeeks } from 'date-fns';
import { fetchWithAuth } from '../../utils/api';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
  
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const WeeklyChart = () => {
  const [startDate, setStartDate] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [endDate, setEndDate] = useState(endOfWeek(new Date(), { weekStartsOn: 1 }));
  const [weeklyData, setWeeklyData] = useState([]);
  const [currentWeek, setCurrentWeek] = useState('This Week');

  useEffect(() => {
    const fetchWeeklyData = async () => {
      try {
        const formattedStartDate = format(startDate, 'yyyy-MM-dd');
        const formattedEndDate = format(endDate, 'yyyy-MM-dd');
  
        const response = await fetchWithAuth(
          `/api/productivity-data/weekly?start_date=${formattedStartDate}&end_date=${formattedEndDate}`
        );
  
        if (!response.ok) {
          throw new Error(`Failed to fetch weekly data: ${response.statusText}`);
        }
  
        const data = await response.json();
  
        // Format the fetched data - store original values without conversion
        const formattedWeeklyData = data.weekly_data.map((day) => ({
          date: format(new Date(day.day), 'MM/dd'), // Format date for better readability
          workDuration: day.work_duration,
          breakDuration: day.break_duration,
          tasksCompleted: parseInt(day.tasks_completed, 10),
          pomodoroCycles: parseInt(day.pomodoro_cycles, 10),
        }));
  
        setWeeklyData(formattedWeeklyData);
  
        if (startOfWeek(new Date(), { weekStartsOn: 1 }).toISOString() === startDate.toISOString()) {
          setCurrentWeek('This Week');
        } else if (
          startOfWeek(subWeeks(new Date(), 1), { weekStartsOn: 1 }).toISOString() ===
          startDate.toISOString()
        ) {
          setCurrentWeek('Last Week');
        } else {
          const weekNumber = Math.ceil((startDate.getDate() + 6) / 7);
          setCurrentWeek(`Week ${weekNumber} of ${format(startDate, 'MMMM yyyy')}`);
        }
      } catch (error) {
        console.error('Error fetching weekly productivity data:', error);
      }
    };
  
    fetchWeeklyData();
  }, [startDate, endDate]);  

  const handlePreviousWeek = () => {
    setStartDate((prev) => subWeeks(prev, 1));
    setEndDate((prev) => subWeeks(prev, 1));
  };

  const handleNextWeek = () => {
    setStartDate((prev) => addWeeks(prev, 1));
    setEndDate((prev) => addWeeks(prev, 1));
  };

  const chartData = {
    labels: weeklyData.map((day) => day.date),
    datasets: [
      {
        label: 'Work Duration (hours)',
        data: weeklyData.map((day) => Number(day.workDuration) / 3600), // Convert seconds to hours here
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      },
      {
        label: 'Break Duration (hours)',
        data: weeklyData.map((day) => Number(day.breakDuration) / 3600), // Convert seconds to hours here
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        display: true,
        position: 'top',
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const value = context.raw.toFixed(2);
            return `${context.dataset.label}: ${value} hours`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Hours'
        }
      }
    }
  };

  return (
    <Box>
      <Typography variant="h5" fontWeight="bold" gutterBottom>
        Weekly Productivity - {currentWeek}
      </Typography>
      <Stack direction="row" spacing={2} justifyContent="center" sx={{ mb: 4 }}>
        <Button variant="outlined" onClick={handlePreviousWeek}>
          &lt; Previous Week
        </Button>
        <Button variant="outlined" onClick={handleNextWeek} disabled={startDate >= new Date()}>
          Next Week &gt;
        </Button>
      </Stack>
      <Bar data={chartData} options={options} />
    </Box>
  );
};

export default WeeklyChart;