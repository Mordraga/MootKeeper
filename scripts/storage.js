// storage.js

const API_BASE = "https://streamernetworkfastapi-production.up.railway.app";
const CATEGORIES_KEY = "streamCategories";
const TOKEN_KEY = "twitch_token";
const LOCAL_CONTACTS_KEY = "local_contacts";

// =============================
// LOCAL CONTACTS (localStorage)
// =============================

function genLocalId() {
  return `local_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function loadLocalContacts() {
  try {
    const raw = localStorage.getItem(LOCAL_CONTACTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalContacts(contacts) {
  localStorage.setItem(LOCAL_CONTACTS_KEY, JSON.stringify(contacts));
}

const DEFAULT_CATEGORIES = {
  relationships: ["Friend", "Artist", "Viewer", "Mod", "Moot", "Oshi", "Senpai", "Kohai", "Other"],
  tags: {
    Interests: ["Gaming", "IRL", "Art", "Music", "Tech"],
    Misc: ["Active", "Inactive", "Priority"],
    Personality: ["Seiso", "Ojou", "Genki", "Kuudere", "Tsundere"],
    Language: ["EN", "JP", "GRM"]
  }
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
  if (!isLoggedIn()) return loadLocalContacts();
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
  if (!isLoggedIn()) {
    const contacts = loadLocalContacts();
    const contact = { ...data, id: genLocalId() };
    contacts.push(contact);
    saveLocalContacts(contacts);
    return contact;
  }
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
  if (!isLoggedIn()) {
    const contacts = loadLocalContacts();
    const idx = contacts.findIndex(c => c.id === id);
    if (idx !== -1) {
      contacts[idx] = { ...contacts[idx], ...updated };
      saveLocalContacts(contacts);
      return contacts[idx];
    }
    return null;
  }
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
  if (!isLoggedIn()) {
    saveLocalContacts(loadLocalContacts().filter(c => c.id !== id));
    return { ok: true };
  }
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
    const data = saved ? JSON.parse(saved) : { ...DEFAULT_CATEGORIES };

    // Normalize: flat-array tags (old format) → grouped under "Other"
    if (Array.isArray(data.tags)) {
      data.tags = { Other: data.tags };
    } else if (!data.tags || typeof data.tags !== "object") {
      data.tags = { ...DEFAULT_CATEGORIES.tags };
    }

    // Ensure relationships is an array
    if (!Array.isArray(data.relationships)) {
      data.relationships = [...DEFAULT_CATEGORIES.relationships];
    }

    return data;
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

export function addTag(name, group) {
  const cats = loadCategories();
  const trimmed = name.trim();
  const allTags = Object.values(cats.tags).flat();
  if (!trimmed || allTags.includes(trimmed)) return false;
  if (!cats.tags[group]) cats.tags[group] = [];
  cats.tags[group].push(trimmed);
  saveCategories(cats);
  return true;
}

export function removeTag(name) {
  const cats = loadCategories();
  for (const group of Object.keys(cats.tags)) {
    if (Array.isArray(cats.tags[group])) {
      cats.tags[group] = cats.tags[group].filter(t => t !== name);
    }
  }
  saveCategories(cats);
}

export async function loadUserInfo() {
  const res = await fetch(`${API_BASE}/auth/validate`, {
    headers: authHeaders()
  });
  if (!res.ok) throw new Error("Failed to validate");
  return await res.json();
}