// preferences.js

import { API_BASE, isLoggedIn, authHeaders } from "./auth.js";
import { saveUserTimeFormatPref, saveDisplayNameOverride } from "./settings.js";
import { saveUserTimezone } from "./timezone.js";

const ONBOARDING_DISMISSED_KEY = "onboardingDismissed";

export function loadOnboardingDismissedLocal() {
    return localStorage.getItem(ONBOARDING_DISMISSED_KEY) === "true";
}

export function saveOnboardingDismissedLocal(isDismissed) {
    localStorage.setItem(ONBOARDING_DISMISSED_KEY, String(Boolean(isDismissed)));
}

export async function loadAllPreferences() {
    if (!isLoggedIn()) return;
    try {
        const res = await fetch(`${API_BASE}/user/preferences`, {
            headers: authHeaders()
        });
        if (!res.ok) throw new Error("Failed to fetch preferences");
        const data = await res.json();

        if (data.onboardingDismissed !== undefined) saveOnboardingDismissedLocal(data.onboardingDismissed);
        if (data.timeFormat) saveUserTimeFormatPref(data.timeFormat);
        if (data.timezone) saveUserTimezone(data.timezone);
        if (data.displayNameOverride) saveDisplayNameOverride(data.displayNameOverride);
    } catch (err) {
        console.warn("loadAllPreferences fallback to local storage:", err);
    }
}

export async function savePreference(key, value) {
    if (!isLoggedIn()) return;
    try {
        const res = await fetch(`${API_BASE}/user/preferences`, {
            method: "PATCH",
            headers: authHeaders(),
            body: JSON.stringify({ [key]: value })
        });
        if (!res.ok) throw new Error(`Failed to save preference: ${key}`);
    } catch (err) {
        console.warn(`savePreference(${key}) failed:`, err);
    }
    const res = await fetch(...);
    console.log("[PREFS] PATCH status →", res.status);
    if (!res.ok) throw new Error(`Failed to save preference: ${key}`);
}


















































































