import React, { useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import { Box, Typography, Button, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';
import { format, startOfMonth, endOfMonth, subMonths, addMonths, isThisMonth } from 'date-fns';
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
  // 🔹 NEW: ARIA Live Region State
  const [liveMessage, setLiveMessage] = useState("Monthly productivity chart loaded.");

  useEffect(() => {
    const fetchMonthlyData = async () => {
      try {
        const formattedStartDate = format(startDate, 'yyyy-MM-dd');
        const formattedEndDate = format(endDate, 'yyyy-MM-dd');
  
        setLiveMessage(`Fetching data for ${format(startDate, 'MMMM yyyy')}.`);

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
          workDuration: Number(weekData.work_duration), // Keep seconds for calculation
          breakDuration: Number(weekData.break_duration), // Keep seconds for calculation
          tasksCompleted: parseInt(weekData.tasks_completed, 10),
          pomodoroCycles: parseInt(weekData.pomodoro_cycles, 10),
        }));
  
        setMonthlyData(formattedMonthlyData);
        setCurrentMonth(format(startDate, 'MMMM yyyy'));
        setLiveMessage(`Data for ${format(startDate, 'MMMM yyyy')} loaded. ${formattedMonthlyData.length} weeks of data found.`);
      } catch (error) {
        console.error('Error fetching monthly productivity data:', error);
        setLiveMessage(`Failed to load data for ${format(startDate, 'MMMM yyyy')}.`);
      }
    };
  
    fetchMonthlyData();
  }, [startDate, endDate]);  

  const handlePreviousMonth = () => {
    const newStartDate = startOfMonth(subMonths(startDate, 1));
    setStartDate(newStartDate);
    setEndDate(endOfMonth(newStartDate));
    setLiveMessage(`Viewing previous month.`);
  };

  const handleNextMonth = () => {
    // 🔹 A11y: Check if the next month is the current month or future to manage disabled state
    if (startDate >= startOfMonth(new Date())) return;
    
    const newStartDate = startOfMonth(addMonths(startDate, 1));
    setStartDate(newStartDate);
    setEndDate(endOfMonth(newStartDate));
    setLiveMessage(`Viewing next month.`);
  };

  const chartData = {
    labels: monthlyData.map((week) => week.week),
    datasets: [
      {
        label: 'Work Duration (hours)',
        data: monthlyData.map((week) => week.workDuration / 3600), // Convert seconds to hours
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      },
      {
        label: 'Break Duration (hours)',
        data: monthlyData.map((week) => week.breakDuration / 3600), // Convert seconds to hours
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
      },
      title: {
        display: true,
        text: `Work and Break Duration by Week for ${currentMonth}`,
        font: {
            size: 16
        },
        // 🔹 A11y: The text alternative for the chart is the table below
        // aria-hidden="true" on chart wrapper will handle the chart itself
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

  // 🔹 A11y: Check if the current month is the current calendar month
  const isCurrentOrFutureMonth = startOfMonth(startDate).getTime() >= startOfMonth(new Date()).getTime();
  

  return (
    <Box>
      {/* 1. ARIA Live Region for dynamic announcements */}
      <Box 
        aria-live="polite" 
        sx={{ position: 'absolute', clip: 'rect(0 0 0 0)', width: 1, height: 1, margin: -1, padding: 0, overflow: 'hidden' }}
      >
        {liveMessage}
      </Box>

      {/* 2. Semantic Heading */}
      <Typography variant="h5" component="h1" fontWeight="bold" gutterBottom id="monthly-chart-title">
        Monthly Productivity - {currentMonth}
      </Typography>
      
      {/* 3. Navigation Buttons with ARIA labels and disabled state */}
      <Stack direction="row" spacing={2} justifyContent="center" sx={{ mb: 4 }}>
        <Button 
          variant="outlined" 
          onClick={handlePreviousMonth}
          aria-label="View data for the previous month"
        >
          &lt; Previous Month
        </Button>
        <Button 
          variant="outlined" 
          onClick={handleNextMonth} 
          disabled={isCurrentOrFutureMonth} // Disable if current or future month
          aria-label={isCurrentOrFutureMonth ? "Cannot view data for the next month" : "View data for the next month"}
        >
          Next Month &gt;
        </Button>
      </Stack>
      
      {/* 4. Chart Visualization (Use aria-hidden to let screen readers focus on the table) */}
      <Box 
        sx={{ height: '400px', width: '100%', maxWidth: '800px', margin: '0 auto' }}
        aria-hidden="true" // Hide the complex visual chart
        role="presentation"
      >
        <Bar data={chartData} options={options} />
      </Box>

      {/* 5. Accessible Data Table */}
      <Box sx={{ mt: 4 }}>
        <Typography 
          variant="h6" 
          component="h2" 
          sx={{ mb: 2 }}
          id="monthly-chart-data-heading"
        >
          Weekly Productivity Data Table ({currentMonth})
        </Typography>
        <TableContainer component={Paper} aria-labelledby="monthly-chart-data-heading">
          <Table size="small" aria-label={`Weekly productivity data for ${currentMonth}`}>
            <TableHead>
              <TableRow>
                <TableCell>Week</TableCell>
                <TableCell align="right">Work Duration (Hours)</TableCell>
                <TableCell align="right">Break Duration (Hours)</TableCell>
                <TableCell align="right">Tasks Completed</TableCell>
                <TableCell align="right">Pomodoro Cycles</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {monthlyData.length > 0 ? (
                monthlyData.map((row) => (
                  <TableRow key={row.week}>
                    <TableCell component="th" scope="row">
                      {row.week}
                    </TableCell>
                    <TableCell align="right">{(row.workDuration / 3600).toFixed(2)}</TableCell>
                    <TableCell align="right">{(row.breakDuration / 3600).toFixed(2)}</TableCell>
                    <TableCell align="right">{row.tasksCompleted}</TableCell>
                    <TableCell align="right">{row.pomodoroCycles}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    No data recorded for {currentMonth}.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Box>
  );
};

export default MonthlyChart;