import React, { useState } from 'react';
import WeeklyChart from './WeeklyChart';
import MonthlyChart from './MonthlyChart';
import AnnualChart from './AnnualChart';
import { Button, Box, Typography } from '@mui/material';

const ProductivityDashboard = () => {
  const [selectedView, setSelectedView] = useState('weekly'); // Default view

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Productivity Dashboard
      </Typography>
      <Box sx={{ display: 'flex', gap: 2, mb: 4 }}>
        <Button
          variant={selectedView === 'weekly' ? 'contained' : 'outlined'}
          onClick={() => setSelectedView('weekly')}
        >
          Weekly
        </Button>
        <Button
          variant={selectedView === 'monthly' ? 'contained' : 'outlined'}
          onClick={() => setSelectedView('monthly')}
        >
          Monthly
        </Button>
        <Button
          variant={selectedView === 'annual' ? 'contained' : 'outlined'}
          onClick={() => setSelectedView('annual')}
        >
          Annual
        </Button>
      </Box>

      <Box>
        {selectedView === 'weekly' && <WeeklyChart />}
        {selectedView === 'monthly' && <MonthlyChart />}
        {selectedView === 'annual' && <AnnualChart />}
        {!selectedView && (
          <Typography>No data available. Please select a view.</Typography>
        )}
      </Box>
    </Box>
  );
};

export default ProductivityDashboard;
