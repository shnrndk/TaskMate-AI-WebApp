import React, { useEffect, useState } from 'react';
import CalendarHeatmap from 'react-calendar-heatmap';
import 'react-calendar-heatmap/dist/styles.css';
import { jwtDecode } from 'jwt-decode';
import { Button, Typography, Box, Grid, Paper } from '@mui/material';
import { Tooltip } from 'react-tooltip';

const ProductivityHeatMap = () => {
  const [dailyData, setDailyData] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [userId, setUserId] = useState(null);
  const [tooltipContent, setTooltipContent] = useState('');
  const [selectedRange, setSelectedRange] = useState({
    start: '2024-01-01',
    end: '2025-01-01'
  });

  const currentYear = new Date().getFullYear();
  const years = [currentYear - 3, currentYear - 2, currentYear - 1, currentYear];

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
        setDailyData(formattedData);
        setMetrics(result.metrics);
      })
      .catch(console.error);
  }, [userId, selectedRange]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setUserId(decoded.id);
      } catch (error) {
        console.error('Error decoding token:', error);
      }
    }
  }, []);

  const formatDate = (dateString) => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  const getEfficiencyLabel = (score) => {
    if (score >= 8) return 'Excellent';
    if (score >= 6) return 'Good';
    if (score >= 4) return 'Fair';
    return 'Needs Improvement';
  };

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
        count: existingData ? existingData.efficiencyScore : 0,
        data: existingData
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }
    return dates;
  };

  const getTooltipContent = (value) => {
    if (!value || !value.date) {
      return 'No data available';
    }

    const dayData = value.data;
    if (!dayData) {
      return 'No activity on this day';
    }

    return `
      <div class="text-sm p-2">
        <div class="font-bold mb-2">${formatDate(dayData.date)}</div>
        <div class="grid grid-cols-2 gap-2">
          <div class="font-semibold">Efficiency:</div>
          <div>${dayData.efficiencyScore}/10 (${getEfficiencyLabel(dayData.efficiencyScore)})</div>
          
          <div class="font-semibold">Tasks:</div>
          <div>${dayData.tasksCompleted} completed</div>
          
          <div class="font-semibold">Pomodoros:</div>
          <div>${dayData.pomodoroCycles} cycles</div>
          
          <div class="font-semibold">Work Time:</div>
          <div>${dayData.workDuration} hours</div>
          
          <div class="font-semibold">Break Time:</div>
          <div>${dayData.breakDuration} hours</div>
        </div>
      </div>
    `;
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

      <Box sx={{ overflowX: 'auto', mt: 4 }} className="relative">
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
          tooltipDataAttrs={(value) => ({
            'data-tooltip-id': 'heatmap-tooltip',
            'data-tooltip-html': getTooltipContent(value)
          })}
          showWeekdayLabels
          gutterSize={1}
        />
        <Tooltip 
          id="heatmap-tooltip"
          place="top"
          html={true}
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