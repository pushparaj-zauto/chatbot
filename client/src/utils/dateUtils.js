export const formatTimestamp = (dateString) => {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const formatEventDate = (dateStr, withYear = true) => {
  if (!dateStr) return null;
  try {
    const date = new Date(dateStr);
    const opts = { day: "numeric", month: "short", ...(withYear ? { year: "numeric" } : {}) };
    return date.toLocaleDateString("en-GB", opts); 
  } catch {
    return null;
  }
};


export const formatEventTime = (timeStr, lowerCase = false) => {
  if (!timeStr) return null;
  try {
    const [h, m] = timeStr.split(":").map(Number);
    const d = new Date();
    d.setHours(h, m, 0, 0);
    const out = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
    return lowerCase ? out.toLowerCase() : out; 
  } catch {
    return null;
  }
};


export const getEventDateTime = (event) => {
  if (!event) return { date: null, time: null, combined: null };

  const dateOnly = formatEventDate(event.eventDate, true); 
  const timeOnly = formatEventTime(event.eventTime, true); 

  // If both exist, build a Date with the date's YYYY-MM-DD + time as local time
  if (event.eventDate && event.eventTime) {
    try {
      const datePart = event.eventDate.split("T")[0]; 
      const dt = new Date(`${datePart}T${event.eventTime}:00`);
      const combinedDate = dt.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
      const combinedTime = dt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }).toLowerCase();
      return {
        date: combinedDate,            
        time: combinedTime,           
        combined: `${combinedDate} at ${combinedTime}`
      };
    } catch {
      return { date: dateOnly, time: timeOnly, combined: dateOnly && timeOnly ? `${dateOnly} at ${timeOnly}` : dateOnly || timeOnly };
    }
  }

  // only one exists
  return { date: dateOnly, time: timeOnly, combined: dateOnly && timeOnly ? `${dateOnly} at ${timeOnly}` : dateOnly || timeOnly };
};


export const formatEveDate = (dateStr) => {
  if (!dateStr) return null;

  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
    });
  } catch {
    return null;
  }
};

export const formatEveTime = (timeStr) => {
  if (!timeStr) return null;

  try {
    const [hours, minutes] = timeStr.split(":");
    const date = new Date();
    date.setHours(hours, minutes);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return null;
  }
};
