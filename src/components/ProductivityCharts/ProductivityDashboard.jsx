import React, { useState } from 'react';
import WeeklyChart from './WeeklyChart';
import MonthlyChart from './MonthlyChart';
import AnnualChart from './AnnualChart';
import { Button, Box, Typography } from '@mui/material';

const ProductivityDashboard = () => {
  const [selectedView, setSelectedView] = useState('weekly'); // Default view
  // 🔹 NEW: State for ARIA Live Region announcements
  const [liveMessage, setLiveMessage] = useState("");

  const handleViewChange = (view) => {
    setSelectedView(view);
    // 🔹 A11y: Announce the new view content has loaded
    setLiveMessage(`${view.charAt(0).toUpperCase() + view.slice(1)} productivity chart is now displayed.`);
  };

  // Helper to determine the component to render based on state
  const renderChartComponent = () => {
    switch (selectedView) {
      case 'weekly':
        return <WeeklyChart />;
      case 'monthly':
        return <MonthlyChart />;
      case 'annual':
        return <AnnualChart />;
      default:
        return (
          <Typography>No data available. Please select a view.</Typography>
        );
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      
      {/* 1. ARIA Live Region for dynamic announcements */}
      <Box 
        aria-live="polite" 
        sx={{ position: 'absolute', clip: 'rect(0 0 0 0)', width: 1, height: 1, margin: -1, padding: 0, overflow: 'hidden' }}
      >
        {liveMessage}
      </Box>

      {/* 2. Semantic Heading */}
      <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
        Productivity Dashboard
      </Typography>

      {/* 3. Navigation Group (Role TabList) */}
      <Box 
        sx={{ display: 'flex', gap: 2, mb: 4 }}
        role="tablist" // Indicate this is a set of tab controls
        aria-label="Select productivity view period"
      >
        {/* 4. Weekly Button (Role Tab) */}
        <Button
          variant={selectedView === 'weekly' ? 'contained' : 'outlined'}
          onClick={() => handleViewChange('weekly')}
          role="tab" // Indicates button functions as a tab
          aria-selected={selectedView === 'weekly'} // Indicates current selection
          aria-controls="chart-panel" // Links to the content area
          id="tab-weekly"
        >
          Weekly
        </Button>
        
        {/* 4. Monthly Button (Role Tab) */}
        <Button
          variant={selectedView === 'monthly' ? 'contained' : 'outlined'}
          onClick={() => handleViewChange('monthly')}
          role="tab"
          aria-selected={selectedView === 'monthly'}
          aria-controls="chart-panel"
          id="tab-monthly"
        >
          Monthly
        </Button>
        
        {/* 4. Annual Button (Role Tab) */}
        <Button
          variant={selectedView === 'annual' ? 'contained' : 'outlined'}
          onClick={() => handleViewChange('annual')}
          role="tab"
          aria-selected={selectedView === 'annual'}
          aria-controls="chart-panel"
          id="tab-annual"
        >
          Annual
        </Button>
      </Box>

      {/* 5. Chart Content Area (Role TabPanel) */}
      <Box 
        role="tabpanel"
        id="chart-panel" // Target ID linked from tab buttons
        aria-labelledby={`tab-${selectedView}`} // Links back to the currently active tab button
      >
        {renderChartComponent()}
      </Box>
    </Box>
  );
};

export default ProductivityDashboard;