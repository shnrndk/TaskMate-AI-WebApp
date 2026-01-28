import React, { useEffect, useState } from "react";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import enUS from "date-fns/locale/en-US";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { Paper, Box, Typography, Container, useTheme } from "@mui/material";

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

const STORAGE_KEY = "calendarEvents";

const CalendarPage = () => {
  const [events, setEvents] = useState([]);
  const theme = useTheme();

  // Load events from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        setEvents([]);
        return;
      }

      const parsed = JSON.parse(raw);

      // Convert ISO strings back to Date objects for react-big-calendar
      const mapped = parsed.map((ev) => ({
        ...ev,
        start: new Date(ev.start),
        end: new Date(ev.end),
      }));

      setEvents(mapped);
    } catch (err) {
      console.error("Failed to load calendar events from localStorage:", err);
      setEvents([]);
    }
  }, []);

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
        borderRadius: "4px",
        border: "none",
        fontSize: "0.85rem",
        fontWeight: "500"
      },
    };
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4, flex: 1 }}>
      <Paper
        className="glass-card"
        sx={{
          p: 3,
          height: '80vh',
          display: 'flex',
          flexDirection: 'column'
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
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            eventPropGetter={eventPropGetter}
            defaultView="month"
            views={['month', 'week', 'day']}
            style={{ height: "100%" }}
          />
        </Box>
      </Paper>
    </Container>
  );
};

export default CalendarPage;
