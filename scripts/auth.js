// auth.js

export const API_BASE = "https://streamernetworkfastapi-production.up.railway.app";
const TOKEN_KEY = "twitch_token";

export function getToken() {
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

export function logout() {
  clearToken();
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
  const res = await fetch(`${API_BASE}/auth/validate`, {
    headers: authHeaders()
  });
  if (!res.ok) throw new Error("Failed to validate");
  return await res.json();
}
