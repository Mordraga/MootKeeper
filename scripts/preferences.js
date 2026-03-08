import { API_BASE, isLoggedIn, authHeaders } from "./auth.js";

export function loadOnboardingDismissedLocal() {
    const val = localStorage.getItem(ONBOARDING_DISMISSED_KEY) === "true";
    console.log("[ONBOARDING] loadLocal →", val);
    return val;
}

export function saveOnboardingDismissedLocal(isDismissed) {
    console.log("[ONBOARDING] saveLocal →", isDismissed, new Error().stack);
    localStorage.setItem(ONBOARDING_DISMISSED_KEY, String(Boolean(isDismissed)));
}

export async function loadAllPreferences() {
    if (!isLoggedIn()) return;
    try {
        const res = await fetch(`${API_BASE}/user/preferences`, { headers: authHeaders() });
        if (!res.ok) throw new Error("Failed to fetch preferences");
        const data = await res.json();
        console.log("[PREFS] loadAllPreferences response →", data);
        if (data.onboardingDismissed === true) saveOnboardingDismissedLocal(true);
        if (data.timeFormat) saveUserTimeFormatPref(data.timeFormat);
        if (data.timezone) saveUserTimezone(data.timezone);
        if (data.displayNameOverride) saveDisplayNameOverride(data.displayNameOverride);
    } catch (err) {
        console.warn("loadAllPreferences fallback to local storage:", err);
    }
}

export async function savePreference(key, value) {
    console.log("[PREFS] savePreference →", key, value, new Error().stack);
    if (!isLoggedIn()) return;
    try {
        const res = await fetch(`${API_BASE}/user/preferences`, {
            method: "PATCH",
            headers: authHeaders(),
            body: JSON.stringify({ [key]: value })
        });
        if (!res.ok) throw new Error(`Failed to save preference: ${key}`);
        console.log("[PREFS] savePreference SUCCESS →", key);
    } catch (err) {
        console.warn(`savePreference(${key}) failed:`, err);
    }
}