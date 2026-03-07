// auth.js

export const API_BASE = "https://streamernetworkfastapi-production.up.railway.app";
const TOKEN_KEY = "auth_token";

export function getToken() {
  // migrate legacy keys to unified auth_token
  for (const legacyKey of ["twitch_token", "google_token"]) {
    const legacy = localStorage.getItem(legacyKey);
    if (legacy) {
      localStorage.setItem(TOKEN_KEY, legacy);
      localStorage.removeItem(legacyKey);
    }
  }
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export function isLoggedIn() {
  return !!getToken();
}

export function loginWithTwitch() {
  window.location.href = `${API_BASE}/auth/login`;
}

export function loginWithGoogle() {
  window.location.href = `${API_BASE}/auth/google/login`;
}

export function logout() {
  clearToken();
  localStorage.removeItem("auth_provider");
  window.location.reload();
}

export function authHeaders() {
  const token = getToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { "Authorization": `Bearer ${token}` } : {})
  };
}

export function handleCallback() {
  const hash = window.location.hash;
  if (hash.startsWith("#token=")) {
    const token = hash.slice(7);
    setToken(token);
    window.history.replaceState(null, "", window.location.pathname);
    return true;
  }
  return false;
}

export async function loadUserInfo() {
  const provider = localStorage.getItem("auth_provider");
  const endpoint = provider === "google"
    ? `${API_BASE}/auth/google/validate`
    : `${API_BASE}/auth/validate`;

  const res = await fetch(endpoint, { headers: authHeaders() });
  if (!res.ok) throw new Error("Failed to validate");
  return await res.json();
}
