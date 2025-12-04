import React, { useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import { Box, Typography, Button, Stack } from '@mui/material';
import { format, startOfMonth, endOfMonth, subMonths, addMonths } from 'date-fns';
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

const MonthlyChart = () => {
  const [startDate, setStartDate] = useState(startOfMonth(new Date()));
  const [endDate, setEndDate] = useState(endOfMonth(new Date()));
  const [monthlyData, setMonthlyData] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(format(new Date(), 'MMMM yyyy'));

  useEffect(() => {
    const fetchMonthlyData = async () => {
      try {
        const formattedStartDate = format(startDate, 'yyyy-MM-dd');
        const formattedEndDate = format(endDate, 'yyyy-MM-dd');
  
        const response = await fetchWithAuth(
          `/api/productivity-data/monthly?start_date=${formattedStartDate}&end_date=${formattedEndDate}`
        );
  
        if (!response.ok) {
          throw new Error(`Failed to fetch monthly data: ${response.statusText}`);
        }
  
        const data = await response.json();
  
        // Format the fetched data
        const formattedMonthlyData = data.monthly_data.map((weekData) => ({
          week: `Week ${weekData.week.toString().slice(-2)}`, // Extract week number from YYYYWW format
          workDuration: weekData.work_duration,
          breakDuration: weekData.break_duration,
          tasksCompleted: parseInt(weekData.tasks_completed, 10),
          pomodoroCycles: parseInt(weekData.pomodoro_cycles, 10),
        }));
  
        setMonthlyData(formattedMonthlyData);
        setCurrentMonth(format(startDate, 'MMMM yyyy'));
      } catch (error) {
        console.error('Error fetching monthly productivity data:', error);
      }
    };
  
    fetchMonthlyData();
  }, [startDate, endDate]);  

  const handlePreviousMonth = () => {
    setStartDate((prev) => startOfMonth(subMonths(prev, 1)));
    setEndDate((prev) => endOfMonth(subMonths(prev, 1)));
  };

  const handleNextMonth = () => {
    setStartDate((prev) => startOfMonth(addMonths(prev, 1)));
    setEndDate((prev) => endOfMonth(addMonths(prev, 1)));
  };

  const chartData = {
    labels: monthlyData.map((week) => week.week),
    datasets: [
      {
        label: 'Work Duration (hours)',
        data: monthlyData.map((week) => Number(week.workDuration) / 3600), // Convert seconds to hours
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      },
      {
        label: 'Break Duration (hours)',
        data: monthlyData.map((week) => Number(week.breakDuration) / 3600), // Convert seconds to hours
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
      },
      x: {
        title: {
          display: true,
          text: 'Weeks'
        }
      }
    }
  };

  return (
    <Box>
      <Typography variant="h5" fontWeight="bold" gutterBottom>
        Monthly Productivity - {currentMonth}
      </Typography>
      <Stack direction="row" spacing={2} justifyContent="center" sx={{ mb: 4 }}>
        <Button variant="outlined" onClick={handlePreviousMonth}>
          &lt; Previous Month
        </Button>
        <Button variant="outlined" onClick={handleNextMonth} disabled={startDate >= new Date()}>
          Next Month &gt;
        </Button>
      </Stack>
             <Box sx={{ height: '400px', width: '100%', maxWidth: '800px', margin: '0 auto' }}>
              <Bar data={chartData} options={options} />
            </Box>
    </Box>
  );
};

export default MonthlyChart;