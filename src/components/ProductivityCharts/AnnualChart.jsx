import React, { useEffect, useState } from 'react';
import CalendarHeatmap from 'react-calendar-heatmap';
import 'react-calendar-heatmap/dist/styles.css';
import { jwtDecode } from 'jwt-decode';
import { Button, Typography, Box, Grid, Paper } from '@mui/material';
import { Tooltip } from 'react-tooltip';
import { fetchWithAuth } from "../../utils/api";

const AnnualHeatMap = () => {
  const [dailyData, setDailyData] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [userId, setUserId] = useState(null);
  const [selectedRange, setSelectedRange] = useState({
    start: `${new Date().getFullYear()}-01-01`,
    end: `${new Date().getFullYear() + 1}-01-01`
  });
  // 🔹 NEW: ARIA Live Region State
  const [liveMessage, setLiveMessage] = useState("Productivity dashboard loading.");

  const currentYear = new Date().getFullYear();
  const years = [currentYear - 3, currentYear - 2, currentYear - 1, currentYear];

  // Derive the currently selected year from the state
  const selectedYear = new Date(selectedRange.start).getFullYear();

  useEffect(() => {
    if (!userId) return;
  
    const fetchData = async () => {
      setLiveMessage(`Fetching productivity data for the year ${selectedYear}.`);
      try {
        const response = await fetchWithAuth(
          `/api/productivity-data?start_date=${selectedRange.start}&end_date=${selectedRange.end}`
        );
        const result = await response.json();
  
        const formattedData = result.daily_data.map((day) => ({
          date: new Date(day.day).toISOString().split('T')[0],
          tasksCompleted: parseInt(day.tasks_completed, 10),
          pomodoroCycles: parseInt(day.pomodoro_cycles, 10),
          workDuration: (parseInt(day.work_duration, 10) / 3600).toFixed(2), // Convert seconds to hours
          breakDuration: (parseInt(day.break_duration, 10) / 3600).toFixed(2), // Convert seconds to hours
          efficiencyScore: parseFloat(day.efficiency_score),
        }));
  
        setDailyData(formattedData);
        setMetrics(result.metrics);
        setLiveMessage(`Data for ${selectedYear} loaded. Total tasks completed: ${result.metrics.total_tasks_completed}.`);
      } catch (error) {
        console.error("Error fetching productivity data:", error);
        setLiveMessage(`Failed to load productivity data for ${selectedYear}.`);
      }
    };
  
    fetchData();
  }, [userId, selectedRange]);
  

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setUserId(decoded.id);
      } catch (error) {
        console.error('Error decoding token:', error);
        setLiveMessage("Error decoding user token.");
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
    if (score > 0) return 'Needs Improvement';
    return 'No activity';
  };

  const selectYear = (year) => {
    setSelectedRange({
      start: `${year}-01-01`,
      end: `${year + 1}-01-01`
    });
    setLiveMessage(`Viewing productivity data for the year ${year}.`);
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
  
  // 🔹 NEW: Accessible Legend Content
  const getAccessibleLegend = () => (
    <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 2 }} aria-label="Efficiency Score Color Legend">
      <Typography variant="caption">Less Productive (Efficiency Score)</Typography>
      <Box sx={{ display: 'flex', gap: 0.5 }}>
        <Box sx={{ width: 10, height: 10, backgroundColor: '#ebedf0', border: '1px solid #ccc' }} aria-label="Score 0 or no activity"></Box>
        <Box sx={{ width: 10, height: 10, backgroundColor: '#d6e685' }} aria-label="Score 1-3 (Needs Improvement)"></Box>
        <Box sx={{ width: 10, height: 10, backgroundColor: '#8cc665' }} aria-label="Score 4-5 (Fair)"></Box>
        <Box sx={{ width: 10, height: 10, backgroundColor: '#44a340' }} aria-label="Score 6-7 (Good)"></Box>
        <Box sx={{ width: 10, height: 10, backgroundColor: '#1e6823' }} aria-label="Score 8-10 (Excellent)"></Box>
      </Box>
      <Typography variant="caption">More Productive</Typography>
    </Box>
  );

  return (
    <Box sx={{ p: 3 }}>
      {/* 1. ARIA Live Region */}
      <Box 
        aria-live="polite" 
        sx={{ position: 'absolute', clip: 'rect(0 0 0 0)', width: 1, height: 1, margin: -1, padding: 0, overflow: 'hidden' }}
      >
        {liveMessage}
      </Box>

      <Box sx={{ mb: 4 }}>
        {/* 2. Semantic Heading */}
        <Typography variant="h5" component="h1" fontWeight="bold" gutterBottom>
          Productivity Heatmap for {selectedYear}
        </Typography>
        <Typography id="year-selection-label" variant="subtitle2" sx={{ mb: 1 }}>
            Select a year to view data:
        </Typography>
        <Box 
            sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}
            role="radiogroup" // 3. Use radiogroup role for year selection
            aria-labelledby="year-selection-label"
        >
          {years.map((year) => (
            <Button
              key={year}
              variant={selectedRange.start === `${year}-01-01` ? 'contained' : 'outlined'}
              onClick={() => selectYear(year)}
              sx={{ textTransform: 'none', fontWeight: 'medium' }}
              // 4. ARIA attributes for radio button behavior
              role="radio"
              aria-checked={selectedRange.start === `${year}-01-01`}
              aria-label={`View data for year ${year}`}
            >
              {year}
            </Button>
          ))}
        </Box>
      </Box>

      {metrics && (
        <Paper sx={{ mb: 4, p: 3 }} role="region" aria-label={`Summary Metrics for ${selectedYear}`}>
          <Typography variant="h6" component="h2" gutterBottom>
            Summary Metrics
          </Typography>
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

      <Box sx={{ overflowX: 'auto', mt: 4 }} className="relative" 
           // 5. Use aria-label for the visualization container
           aria-label={`Annual Productivity Heatmap based on Efficiency Score for ${selectedYear}`}
           aria-describedby="heatmap-description"
      >
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
            // 6. Provide accessible content for the square on focus/hover
            'data-tooltip-html': getTooltipContent(value),
            // Fallback aria-label for non-mouse users (screen readers might read this directly on focus)
            'aria-label': value && value.date ? `${formatDate(value.date)}: Efficiency Score ${value.count}/10 (${getEfficiencyLabel(value.count)}).` : 'No data on this day.'
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
      
      {/* 7. Provide a text-based description and legend for the heatmap */}
      <Typography variant="body2" id="heatmap-description" sx={{ mt: 2 }}>
        This chart displays your daily productivity over the year, where the color intensity of each square represents your daily Efficiency Score from 0 (lightest/no activity) to 10 (darkest/most efficient).
      </Typography>
      {getAccessibleLegend()}
      
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

export default AnnualHeatMap;