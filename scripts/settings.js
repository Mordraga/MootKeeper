//settings.js

import { detectTimezone } from "./timezone.js";

function militaryToStandard(hour) {
    if (hour === 0) return 12;
    if (hour > 12) return hour - 12;
    return hour;
}

export function userTimeFormatPref() {
    const saved = localStorage.getItem("timeFormat");
    if (saved === "12") return "12";
    if (saved === "24") return "24";
    // Default to 12-hour format
    return "12";
}

export function formatTime(date) {
    const tz = getUserTimezone();
    const format = userTimeFormatPref();
    return new Intl.DateTimeFormat([], {
        timeZone: tz,
        hour: '2-digit',
        minute: '2-digit',
        hour12: format !== "24"
    }).format(date);

}

export function saveUserTimeFormatPref(format) {
    if (format !== "12" && format !== "24") {
        console.warn("Invalid time format preference:", format);
        return;
    }
    localStorage.setItem("timeFormat", format);
}

export function getUserTimezone() {
    const saved = localStorage.getItem("userTimezone");
    if (saved) return saved;
    const detected = detectTimezone();
    localStorage.setItem("userTimezone", detected);
    return detected;
}

export function saveUserTimezone(timezone) {
    localStorage.setItem("userTimezone", timezone);
}

export function loadDisplayNameOverride() {
    return localStorage.getItem("displayNameOverride") || null;
}

export function saveDisplayNameOverride(name) {
    localStorage.setItem("displayNameOverride", name?.trim() || "");
}