import React, { useEffect, useState, useCallback } from "react";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import enUS from "date-fns/locale/en-US";
import "react-big-calendar/lib/css/react-big-calendar.css";
import {
  Paper,
  Box,
  Typography,
  Container,
  useTheme,
  Dialog,
  DialogContent,
  IconButton,
  Button,
  Stack,
  ButtonGroup,
  alpha,
  styled
} from "@mui/material";
import {
  ChevronLeft,
  ChevronRight,
  Today,
  CalendarViewMonth,
  CalendarViewWeek,
  CalendarViewDay
} from "@mui/icons-material";
import { fetchWithAuth } from "../utils/api";
import TaskForm from "./TaskForm";

const locales = {
  "en-US": enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
});

// Styled Wrapper for deeper customization and overriding RBC styles
const StyledCalendarWrapper = styled('div')(({ theme }) => ({
  height: '100%',
  '& .rbc-calendar': {
    color: theme.palette.text.primary,
    fontFamily: theme.typography.fontFamily,
  },
  '& .rbc-header': {
    padding: '12px 0',
    fontWeight: 600,
    backgroundColor: alpha(theme.palette.background.default, 0.5),
    borderBottom: `1px solid ${theme.palette.divider}`,
    textTransform: 'uppercase',
    fontSize: '0.75rem',
    letterSpacing: '1px',
  },
  '& .rbc-month-view, & .rbc-time-view': {
    border: 'none', // Remove outer border
  },
  '& .rbc-day-bg + .rbc-day-bg': {
    borderLeft: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  },
  '& .rbc-month-row + .rbc-month-row': {
    borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  },
  '& .rbc-off-range-bg': {
    backgroundColor: alpha(theme.palette.action.hover, 0.5),
  },
  '& .rbc-today': {
    backgroundColor: alpha(theme.palette.primary.main, 0.08),
  },
  '& .rbc-time-header': {
    borderBottom: `1px solid ${theme.palette.divider}`,
  },
  '& .rbc-time-content': {
    borderTop: 'none',
  },
  '& .rbc-timeslot-group': {
    borderBottom: `1px solid ${alpha(theme.palette.divider, 0.15)}`,
  },
  '& .rbc-day-slot .rbc-time-slot': {
    borderTop: `1px dashed ${alpha(theme.palette.divider, 0.1)}`, // Softer grid lines
  },
  '& .rbc-time-view .rbc-header': {
    borderBottom: `1px solid ${theme.palette.divider}`,
  },
  '& .rbc-time-view .rbc-allday-cell': {
    display: 'none', // Hide all day row if not needed, or style it
  },
  '& ::-webkit-scrollbar': {
    width: '8px',
    height: '8px',
  },
  '& ::-webkit-scrollbar-thumb': {
    backgroundColor: alpha(theme.palette.text.secondary, 0.2),
    borderRadius: '4px',
  },
}));

const CustomToolbar = ({ label, onNavigate, onView, view }) => {
  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      justifyContent="space-between"
      alignItems="center"
      spacing={2}
      sx={{ mb: 3, p: 1 }}
    >
      <Stack direction="row" spacing={1} alignItems="center">
        <Button
          onClick={() => onNavigate('TODAY')}
          variant="outlined"
          startIcon={<Today />}
          size="small"
        >
          Today
        </Button>
        <IconButton onClick={() => onNavigate('PREV')} size="small">
          <ChevronLeft />
        </IconButton>
        <IconButton onClick={() => onNavigate('NEXT')} size="small">
          <ChevronRight />
        </IconButton>
      </Stack>

      <Typography variant="h5" fontWeight="700" sx={{ textTransform: 'capitalize' }}>
        {label}
      </Typography>

      <ButtonGroup variant="outlined" size="small">
        <Button
          onClick={() => onView('month')}
          variant={view === 'month' ? 'contained' : 'outlined'}
          startIcon={<CalendarViewMonth />}
        >
          Month
        </Button>
        <Button
          onClick={() => onView('week')}
          variant={view === 'week' ? 'contained' : 'outlined'}
          startIcon={<CalendarViewWeek />}
        >
          Week
        </Button>
        <Button
          onClick={() => onView('day')}
          variant={view === 'day' ? 'contained' : 'outlined'}
          startIcon={<CalendarViewDay />}
        >
          Day
        </Button>
      </ButtonGroup>
    </Stack>
  );
};


const CalendarPage = () => {
  const [events, setEvents] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [view, setView] = useState('month'); // Track view state
  const theme = useTheme();

  const fetchEvents = useCallback(async () => {
    try {
      const response = await fetchWithAuth("/api/tasks");
      if (response.ok) {
        const tasks = await response.json();

        // Map tasks to calendar events
        const mapped = tasks
          .filter(task => task.start_time && task.end_time) // Only show scheduled tasks
          .map(task => ({
            id: task.id,
            title: task.title,
            category: task.category,
            priority: task.priority,
            start: new Date(task.start_time),
            end: new Date(task.end_time),
            desc: task.description
          }));

        setEvents(mapped);
      } else {
        console.error("Failed to fetch tasks for calendar");
      }
    } catch (err) {
      console.error("Failed to load calendar events:", err);
    }
  }, []);

  // Load events from API on mount
  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Handle slot selection
  const handleSelectSlot = ({ start, end }) => {
    // Calculate duration in minutes
    const duration = Math.abs(end - start) / 60000;

    const initialData = {
      date: format(start, 'yyyy-MM-dd'),
      time: format(start, 'HH:mm'),
      duration: Math.round(duration)
    };

    setSelectedSlot(initialData);
    setIsModalOpen(true);
  };

  const handleTaskAdded = () => {
    setIsModalOpen(false);
    fetchEvents(); // Refresh events
  };

  // Color events based on priority
  const eventPropGetter = (event) => {
    let backgroundColor = theme.palette.primary.main;

    switch (event.priority) {
      case "High":
        backgroundColor = theme.palette.error.main;
        break;
      case "Medium":
        backgroundColor = theme.palette.warning.main;
        break;
      case "Low":
        backgroundColor = theme.palette.success.main;
        break;
      default:
        break;
    }

    return {
      style: {
        backgroundColor,
        color: "#fff",
        borderRadius: "6px",
        border: "none",
        fontSize: "0.80rem",
        fontWeight: "600",
        padding: "2px 5px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.15)"
      },
    };
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4, flex: 1, display: 'flex', flexDirection: 'column' }}>
      <Paper
        className="glass-card"
        sx={{
          p: 3,
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden', // Fix for jumping out bug
          maxHeight: '85vh',  // Constrain height
        }}
      >
        <Typography variant="h4" gutterBottom fontWeight="700" sx={{ mb: 3 }}>
          Schedule
        </Typography>
        <Box sx={{
          flex: 1,
          // Customizing RBC for dark/light mode
          '& .rbc-calendar': { color: 'text.primary' },
          '& .rbc-off-range-bg': { bgcolor: 'action.hover' },
          '& .rbc-today': { bgcolor: 'action.selected' },
        }}>
          <StyledCalendarWrapper>
            <Calendar
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              eventPropGetter={eventPropGetter}
              defaultView="month"
              view={view} // Controlled view
              onView={setView} // Update view state
              views={['month', 'week', 'day']}
              selectable
              onSelectSlot={handleSelectSlot}
              components={{
                toolbar: CustomToolbar
              }}
            />
          </StyledCalendarWrapper>
        </Box>
      </Paper>

      {/* Task Creation Modal */}
      <Dialog
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        maxWidth="sm"
        fullWidth
        scroll="body" // Allows scrolling the page body if modal is too tall, preventing double scrollbars
        PaperProps={{
          sx: {
            borderRadius: 2,
            bgcolor: 'background.paper',
            backgroundImage: 'none',
            overflow: 'visible' // Prevent internal scrollbar jitter
          }
        }}
      >
        <DialogContent sx={{ p: 0, overflow: 'visible' }}>
          <TaskForm
            onTaskAdded={handleTaskAdded}
            initialData={selectedSlot}
            minimal={true}
          />
        </DialogContent>
      </Dialog>
    </Container>
  );
};

export default CalendarPage;
