import React, { useEffect, useState } from "react";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import enUS from "date-fns/locale/en-US";
import "react-big-calendar/lib/css/react-big-calendar.css";

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
    let backgroundColor = "#1976d2"; // default

    switch (event.priority) {
      case "High":
        backgroundColor = "#d32f2f"; // red
        break;
      case "Medium":
        backgroundColor = "#ed6c02"; // orange
        break;
      case "Low":
        backgroundColor = "#2e7d32"; // green
        break;
      default:
        break;
    }

    return {
      style: {
        backgroundColor,
        color: "white",
        borderRadius: "4px",
        border: "none",
        padding: "2px 4px",
        fontSize: "0.8rem",
      },
    };
  };

  return (
    <div
      className="calendar-wrapper"
      style={{ height: "calc(100vh - 64px)", padding: "16px" }}
    >
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        eventPropGetter={eventPropGetter}
        defaultView="week"
        style={{ height: "100%" }}
      />
    </div>
  );
};

export default CalendarPage;
