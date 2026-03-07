// preferences.js

import { API_BASE, isLoggedIn, authHeaders } from "./auth.js";

const ONBOARDING_DISMISSED_KEY = "onboardingDismissed";

export function loadOnboardingDismissedLocal() {
  return localStorage.getItem(ONBOARDING_DISMISSED_KEY) === "true";
}

export function saveOnboardingDismissedLocal(isDismissed) {
  localStorage.setItem(ONBOARDING_DISMISSED_KEY, String(Boolean(isDismissed)));
}

export async function loadOnboardingDismissed() {
  const localValue = loadOnboardingDismissedLocal();
  if (!isLoggedIn()) return localValue;

  try {
    const res = await fetch(`${API_BASE}/user/preferences`, {
      headers: authHeaders()
    });
    if (!res.ok) throw new Error("Failed to fetch onboarding preference");
    const data = await res.json();
    const isDismissed = Boolean(data?.onboardingDismissed);
    saveOnboardingDismissedLocal(isDismissed);
    return isDismissed;
  } catch (err) {
    console.warn("loadOnboardingDismissed fallback to local storage:", err);
    return localValue;
  }
}

export async function saveOnboardingDismissed(isDismissed) {
  const normalized = Boolean(isDismissed);
  saveOnboardingDismissedLocal(normalized);

  if (!isLoggedIn()) return;

  try {
    const res = await fetch(`${API_BASE}/user/preferences`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify({ onboardingDismissed: normalized })
    });
    if (!res.ok) throw new Error("Failed to save onboarding preference");
  } catch (err) {
    console.warn("saveOnboardingDismissed saved locally, API call failed:", err);
  }
}
