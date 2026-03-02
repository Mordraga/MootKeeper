// timezone.js
// Handles timezone detection, storage, and period conversion

const USER_TZ_KEY = "userTimezone";

// ========== COMMON TIMEZONES ==========
// Keeping it human readable, not exhaustive
export const COMMON_TIMEZONES = [
  { label: "Hawaii (HST)",           iana: "Pacific/Honolulu" },
  { label: "Alaska (AKST)",          iana: "America/Anchorage" },
  { label: "Pacific (PST/PDT)",      iana: "America/Los_Angeles" },
  { label: "Mountain (MST/MDT)",     iana: "America/Denver" },
  { label: "Mountain No DST (MST)",  iana: "America/Phoenix" },
  { label: "Central (CST/CDT)",      iana: "America/Chicago" },
  { label: "Eastern (EST/EDT)",      iana: "America/New_York" },
  { label: "Atlantic (AST/ADT)",     iana: "America/Halifax" },
  { label: "Brazil (BRT)",           iana: "America/Sao_Paulo" },
  { label: "UK (GMT/BST)",           iana: "Europe/London" },
  { label: "Central Europe (CET)",   iana: "Europe/Berlin" },
  { label: "Eastern Europe (EET)",   iana: "Europe/Helsinki" },
  { label: "Moscow (MSK)",           iana: "Europe/Moscow" },
  { label: "Gulf (GST)",             iana: "Asia/Dubai" },
  { label: "India (IST)",            iana: "Asia/Kolkata" },
  { label: "China/HK/SG (CST/SGT)", iana: "Asia/Shanghai" },
  { label: "Korea (KST)",            iana: "Asia/Seoul" },
  { label: "Japan (JST)",            iana: "Asia/Tokyo" },
  { label: "Australia East (AEST)",  iana: "Australia/Sydney" },
  { label: "New Zealand (NZST)",     iana: "Pacific/Auckland" },
];

// ========== PERIODS ==========
// Each period defined by a representative hour in 24h
export const PERIODS = [
  { id: "morning",   label: "Morning",   hour: 9  },
  { id: "afternoon", label: "Afternoon", hour: 14 },
  { id: "evening",   label: "Evening",   hour: 19 },
  { id: "night",     label: "Night",     hour: 23 },
];

export const DAYS = [
  { id: "SU", label: "Sun" },
  { id: "MO", label: "Mon" },
  { id: "TU", label: "Tue" },
  { id: "WE", label: "Wed" },
  { id: "TH", label: "Thu" },
  { id: "FR", label: "Fri" },
  { id: "SA", label: "Sat" },
];

// ========== USER TIMEZONE ==========

export function detectTimezone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

export function loadUserTimezone() {
  return localStorage.getItem(USER_TZ_KEY) || detectTimezone();
}

export function saveUserTimezone(tz) {
  localStorage.setItem(USER_TZ_KEY, tz);
}

// ========== CONVERSION ==========

/**
 * Convert a period from one timezone to another.
 * Returns the period label in the target timezone.
 */
export function convertPeriod(periodId, fromTz, toTz) {
  if (!fromTz || !toTz || fromTz === toTz) return null;

  const period = PERIODS.find(p => p.id === periodId);
  if (!period) return null;

  // Use a fixed reference date (doesn't matter which, we just want hour conversion)
  const ref = new Date();
  ref.setFullYear(2024, 0, 15); // Jan 15 2024 - avoids DST edge cases for display

  // Build a date string representing the period hour in the contact's timezone
  const fromFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone: fromTz,
    hour: "numeric",
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });

  // Get UTC offset difference by comparing formatted hours
  const localHour = getHourInTz(period.hour, fromTz, toTz);

  return hourToPeriodLabel(localHour);
}

function getHourInTz(hour, fromTz, toTz) {
  // Create a date at the given hour in fromTz
  // Use en-CA for YYYY-MM-DD format consistency
  const dateStr = "2024-01-15";
  const timeStr = `${String(hour).padStart(2, "0")}:00:00`;

  // Parse as if it's in fromTz using Intl tricks
  const fromDate = new Date(`${dateStr}T${timeStr}`);

  // Get the UTC time this corresponds to in fromTz
  const fromParts = getDateParts(fromDate, fromTz);
  const toParts = getDateParts(fromDate, toTz);

  // Find UTC equivalent
  const utcMs = fromDate.getTime()
    - (fromParts.hour * 60 + fromParts.minute) * 60000
    + (hour * 60) * 60000;

  // Now get target tz hour
  const targetDate = new Date(utcMs);
  const target = getDateParts(targetDate, toTz);

  // Adjust: find what hour in toTz corresponds to `hour` in fromTz
  // Simpler approach: use offset difference
  const offsetDiff = getTzOffsetHours(toTz) - getTzOffsetHours(fromTz);
  let adjusted = hour + offsetDiff;

  // Wrap to 0-23
  adjusted = ((adjusted % 24) + 24) % 24;
  return adjusted;
}

function getDateParts(date, tz) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hour: "numeric",
    minute: "numeric",
    hour12: false
  }).formatToParts(date);

  return {
    hour: parseInt(parts.find(p => p.type === "hour")?.value || "0"),
    minute: parseInt(parts.find(p => p.type === "minute")?.value || "0")
  };
}

function getTzOffsetHours(tz) {
  const now = new Date("2024-01-15T12:00:00Z");
  const parts = getDateParts(now, tz);
  // UTC is 12:00, so offset = parts.hour - 12
  return parts.hour - 12;
}

function hourToPeriodLabel(hour) {
  if (hour >= 5 && hour < 12) return "Morning";
  if (hour >= 12 && hour < 17) return "Afternoon";
  if (hour >= 17 && hour < 21) return "Evening";
  return "Night";
}

/**
 * Get short timezone abbreviation for display
 */
export function getTzAbbr(iana) {
  if (!iana) return "";
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: iana,
      timeZoneName: "short"
    }).formatToParts(new Date());
    return parts.find(p => p.type === "timeZoneName")?.value || iana;
  } catch {
    return iana;
  }
}

/**
 * Find closest matching label for an IANA timezone
 */
export function getTzLabel(iana) {
  return COMMON_TIMEZONES.find(t => t.iana === iana)?.label || iana;
}

// ========== LIVE CLOCK ==========

export function getCurrentTimeInTz(iana) {
  if (!iana) return "";
  try {
    return new Intl.DateTimeFormat("en-US", {
      timeZone: iana,
      hour: "numeric",
      minute: "2-digit",
      hour12: true
    }).format(new Date());
  } catch {
    return "";
  }
}

// ========== HOUR RANGE ==========

export function parseTimeInput(str) {
  if (!str) return null;
  str = str.trim().toUpperCase();

  const isPM = str.includes("PM");
  const isAM = str.includes("AM");

  const clean = str.replace(/[AP]M/g, "").replace(/[^\d:]/g, "").trim();

  let hours, minutes = 0;

  if (clean.includes(":")) {
    const parts = clean.split(":");
    hours = parseInt(parts[0]);
    minutes = parseInt(parts[1]) || 0;
  } else {
    hours = parseInt(clean);
  }

  if (isNaN(hours)) return null;

  if (isPM && hours !== 12) hours += 12;
  if (isAM && hours === 12) hours = 0;

  hours = hours % 24;
  return hours + (minutes / 60);
}

export function convertHour(hour24, fromTz, toTz) {
  if (hour24 === null) return null;
  const offset = getTzOffsetHours(toTz) - getTzOffsetHours(fromTz);
  let converted = (hour24 + offset + 24) % 24;

  const h = Math.floor(converted);
  const m = Math.round((converted - h) * 60);
  const ampm = h >= 12 ? "PM" : "AM";
  const display = h % 12 === 0 ? 12 : h % 12;
  const minStr = m > 0 ? `:${String(m).padStart(2, "0")}` : "";
  return `${display}${minStr} ${ampm}`;
}

export function convertRange(fromStr, toStr, contactTz, userTz) {
  const from = parseTimeInput(fromStr);
  const to = parseTimeInput(toStr);
  if (from === null || to === null) return null;
  return {
    from: convertHour(from, contactTz, userTz),
    to: convertHour(to, contactTz, userTz)
  };
}