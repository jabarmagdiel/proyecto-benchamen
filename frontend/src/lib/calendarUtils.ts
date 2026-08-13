/**
 * Utility functions for exporting events to client/user personal Google Calendar and iCal (.ics)
 */

export interface CalendarEventData {
  title: string;
  description?: string;
  date: string; // "YYYY-MM-DD"
  startTime?: string; // "HH:MM" e.g. "09:00"
  endTime?: string; // "HH:MM" e.g. "10:00"
  location?: string;
}

/**
 * Formats a date + time string into UTC ISO string formatted for Google Calendar URLs: YYYYMMDDTHHmmssZ
 */
function formatToGCalDate(dateStr: string, timeStr: string = "09:00"): string {
  try {
    const [year, month, day] = dateStr.split("-").map(Number);
    const [hours, minutes] = (timeStr || "09:00").split(":").map(Number);
    
    // Create local date object and format to UTC YYYYMMDDTHHmmssZ
    const d = new Date(year, month - 1, day, hours, minutes);
    return d.toISOString().replace(/-|:|\.\d+/g, "");
  } catch {
    // Fallback if parsing fails
    const cleanDate = dateStr.replace(/-/g, "");
    const cleanTime = (timeStr || "0900").replace(":", "") + "00";
    return `${cleanDate}T${cleanTime}Z`;
  }
}

/**
 * Generates a web link to open Google Calendar with event details pre-filled.
 * Client/User can click "Save" in Google Calendar to add to their personal calendar.
 */
export function getGoogleCalendarUrl(event: CalendarEventData): string {
  const startStr = formatToGCalDate(event.date, event.startTime || "09:00");
  
  // Calculate end time (default to 1 hour later if not provided)
  let endStr: string;
  if (event.endTime) {
    endStr = formatToGCalDate(event.date, event.endTime);
  } else {
    const [h, m] = (event.startTime || "09:00").split(":").map(Number);
    const endH = (h + 1).toString().padStart(2, "0");
    endStr = formatToGCalDate(event.date, `${endH}:${m.toString().padStart(2, "0")}`);
  }

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates: `${startStr}/${endStr}`,
    details: event.description || "",
    location: event.location || "Benchamen Marketing",
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Generates and triggers the download of an .ics (iCalendar) file
 * Compatible with Apple Calendar, Outlook, Google Calendar, Mobile Calendar.
 */
export function downloadIcsFile(event: CalendarEventData): void {
  const startStr = formatToGCalDate(event.date, event.startTime || "09:00");
  
  let endStr: string;
  if (event.endTime) {
    endStr = formatToGCalDate(event.date, event.endTime);
  } else {
    const [h, m] = (event.startTime || "09:00").split(":").map(Number);
    const endH = (h + 1).toString().padStart(2, "0");
    endStr = formatToGCalDate(event.date, `${endH}:${m.toString().padStart(2, "0")}`);
  }

  const icsContent = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Benchamen Marketing//SW Interno//ES",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `SUMMARY:${event.title.replace(/\n/g, "\\n")}`,
    `DESCRIPTION:${(event.description || "").replace(/\n/g, "\\n")}`,
    `LOCATION:${(event.location || "Benchamen Marketing").replace(/\n/g, "\\n")}`,
    `DTSTART:${startStr}`,
    `DTEND:${endStr}`,
    `DTSTAMP:${new Date().toISOString().replace(/-|:|\.\d+/g, "")}`,
    `STATUS:CONFIRMED`,
    "END:VEVENT",
    "END:VCALENDAR"
  ].join("\r\n");

  const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
  const link = document.createElement("a");
  link.href = window.URL.createObjectURL(blob);
  link.setAttribute("download", `${event.title.toLowerCase().replace(/[^a-z0-9]/g, "_")}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
