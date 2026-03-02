// storage.js

const API_BASE = "https://streamernetworkfastapi-production.up.railway.app";
const CATEGORIES_KEY = "streamCategories";
const TOKEN_KEY = "twitch_token";

const DEFAULT_CATEGORIES = {
  relationships: ["Collab", "Artist", "Friend", "Mod", "Viewer", "Other"],
  tags: ["chaotic", "feral", "cozy", "horror", "wholesome", "nsfw"]
};

// =============================
// AUTH
// =============================

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

function authHeaders() {
  const token = getToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { "Authorization": `Bearer ${token}` } : {})
  };
}

// Handle callback - grab token from URL hash
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

// =============================
// CONTACTS (API)
// =============================

export async function loadContacts() {
  try {
    const res = await fetch(`${API_BASE}/contacts`, {
      headers: authHeaders()
    });
    if (res.status === 401) {
      clearToken();
      return [];
    }
    if (!res.ok) throw new Error("Failed to fetch contacts");
    return await res.json();
  } catch (err) {
    console.error("loadContacts error:", err);
    return [];
  }
}

export async function addContact(data) {
  try {
    const res = await fetch(`${API_BASE}/contacts`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error("Failed to add contact");
    return await res.json();
  } catch (err) {
    console.error("addContact error:", err);
  }
}

export async function updateContact(id, updated) {
  try {
    const res = await fetch(`${API_BASE}/contacts/${id}`, {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify(updated)
    });
    if (!res.ok) throw new Error("Failed to update contact");
    return await res.json();
  } catch (err) {
    console.error("updateContact error:", err);
  }
}

export async function deleteContact(id) {
  try {
    const res = await fetch(`${API_BASE}/contacts/${id}`, {
      method: "DELETE",
      headers: authHeaders()
    });
    if (!res.ok) throw new Error("Failed to delete contact");
    return await res.json();
  } catch (err) {
    console.error("deleteContact error:", err);
  }
}

// =============================
// CATEGORIES (localStorage)
// =============================

export function loadCategories() {
  try {
    const saved = localStorage.getItem(CATEGORIES_KEY);
    return saved ? JSON.parse(saved) : { ...DEFAULT_CATEGORIES };
  } catch {
    return { ...DEFAULT_CATEGORIES };
  }
}

export function saveCategories(data) {
  localStorage.setItem(CATEGORIES_KEY, JSON.stringify(data));
}

export function addRelationship(name) {
  const cats = loadCategories();
  const trimmed = name.trim();
  if (!trimmed || cats.relationships.includes(trimmed)) return false;
  cats.relationships.push(trimmed);
  saveCategories(cats);
  return true;
}

export function removeRelationship(name) {
  const cats = loadCategories();
  cats.relationships = cats.relationships.filter(r => r !== name);
  saveCategories(cats);
}

export function addTag(name) {
  const cats = loadCategories();
  const trimmed = name.trim();
  if (!trimmed || cats.tags.includes(trimmed)) return false;
  cats.tags.push(trimmed);
  saveCategories(cats);
  return true;
}

export function removeTag(name) {
  const cats = loadCategories();
  cats.tags = cats.tags.filter(t => t !== name);
  saveCategories(cats);
}

export async function loadUserInfo() {
  const res = await fetch(`${API_BASE}/auth/validate`, {
    headers: authHeaders()
  });
  const data = await res.json();
  
  const img = document.createElement("img");
  img.src = data.profile_image_url;
  img.alt = data.display_name;
  img.style.width = "32px";
  img.style.height = "32px";
  img.style.borderRadius = "50%";
  
  const p = document.createElement("p");
  p.textContent = `@${data.display_name}`;
  p.style.margin = "0";
  
  const logoutBtn = document.getElementById("logout-btn");
  logoutBtn.before(img);
  logoutBtn.before(p);
}