import React, { useEffect, useState } from 'react';
import CalendarHeatmap from 'react-calendar-heatmap';
import 'react-calendar-heatmap/dist/styles.css';
import { jwtDecode } from 'jwt-decode';
import { Button, Typography, Box, Grid, Tooltip, Paper } from '@mui/material';

const ProductivityHeatMap = () => {
  const [dailyData, setDailyData] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [userId, setUserId] = useState(null);
  const [selectedRange, setSelectedRange] = useState({
    start: '2024-01-01',
    end: '2025-01-01'
  });

  const currentYear = new Date().getFullYear();
  const years = [currentYear - 3, currentYear - 2, currentYear - 1, currentYear];

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        console.log('Decoded token:', decoded);
        setUserId(decoded.id);
      } catch (error) {
        console.error('Error decoding token:', error);
      }
    }
  }, []);

  useEffect(() => {
    if(!userId) return;
    fetch(`api/productivity-data?user_id=${userId}&start_date=${selectedRange.start}&end_date=${selectedRange.end}`)
      .then(response => response.json())
      .then((result) => {
        const formattedData = result.daily_data.map(day => ({
          date: new Date(day.day).toISOString().split('T')[0],
          tasksCompleted: parseInt(day.tasks_completed),
          pomodoroCycles: parseInt(day.pomodoro_cycles),
          workDuration: (parseInt(day.work_duration) / 3600).toFixed(2),
          breakDuration: (parseInt(day.break_duration) / 3600).toFixed(2),
          efficiencyScore: parseFloat(day.efficiency_score)
        }));
        console.log('Formatted data:', formattedData);
        setDailyData(formattedData);
        setMetrics(result.metrics);
      })
      .catch(console.error);
  }, [userId, selectedRange]);

  const selectYear = (year) => {
    setSelectedRange({
      start: `${year}-01-01`,
      end: `${year + 1}-01-01`
    });
  };

  const getFilledDates = () => {
    const startDate = new Date(selectedRange.start);
    const endDate = new Date(selectedRange.end);
    const dates = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const existingData = dailyData.find(d => d.date === dateStr);
      
      dates.push({
        date: dateStr,
        count: existingData ? existingData.efficiencyScore : 0
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }
    return dates;
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" fontWeight="bold" gutterBottom>
          Productivity Heatmap
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          {years.map((year) => (
            <Button
              key={year}
              variant={selectedRange.start === `${year}-01-01` ? 'contained' : 'outlined'}
              onClick={() => selectYear(year)}
              sx={{ textTransform: 'none', fontWeight: 'medium' }}
            >
              {year}
            </Button>
          ))}
        </Box>
      </Box>

      {metrics && (
        <Paper sx={{ mb: 4, p: 3 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={4}>
              <Typography>
                <strong>Total Tasks Completed:</strong> {metrics.total_tasks_completed}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Typography>
                <strong>Total Pomodoro Cycles:</strong> {metrics.total_pomodoro_cycles}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Typography>
                <strong>Total Work Duration:</strong> {(parseInt(metrics.total_work_duration) / 3600).toFixed(2)} hours
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Typography>
                <strong>Total Break Duration:</strong> {(parseInt(metrics.total_break_duration) / 3600).toFixed(2)} hours
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Typography>
                <strong>Average Tasks Per Day:</strong> {metrics.average_tasks_per_day}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Typography>
                <strong>Average Pomodoro Cycles Per Day:</strong> {metrics.average_pomodoro_cycles_per_day}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Typography>
                <strong>Break-to-Work Ratio:</strong> {metrics.break_to_work_ratio}
              </Typography>
            </Grid>
          </Grid>
        </Paper>
      )}

      <Box sx={{ overflowX: 'auto', mt: 4 }}>
        <CalendarHeatmap
          startDate={new Date(selectedRange.start)}
          endDate={new Date(selectedRange.end)}
          values={getFilledDates()}
          classForValue={(value) => {
            if (!value || value.count === 0) return 'color-empty';
            const score = value.count;
            if (score >= 8) return 'color-scale-4';
            if (score >= 6) return 'color-scale-3';
            if (score >= 4) return 'color-scale-2';
            return 'color-scale-1';
          }}
          tooltipDataAttrs={(value) => {
            if (!value || !value.date) return { 'data-tip': 'No data available' };

            const dayData = dailyData.find((d) => d.date === value.date);
            if (!dayData) return { 'data-tip': 'No activity on this day' };

            return {
              'data-tip': `
                Date: ${dayData.date}
                Efficiency Score: ${dayData.efficiencyScore}
                Tasks Completed: ${dayData.tasksCompleted}
                Pomodoro Cycles: ${dayData.pomodoroCycles}
                Work Duration: ${dayData.workDuration} hrs
                Break Duration: ${dayData.breakDuration} hrs
              `,
            };
          }}
          showWeekdayLabels
          gutterSize={1}
        />
      </Box>

      <style jsx>{`
        .color-empty {
          fill: #ebedf0;
        }
        .color-scale-1 {
          fill: #d6e685;
        }
        .color-scale-2 {
          fill: #8cc665;
        }
        .color-scale-3 {
          fill: #44a340;
        }
        .color-scale-4 {
          fill: #1e6823;
        }
      `}</style>
    </Box>
  );
};

export default ProductivityHeatMap;