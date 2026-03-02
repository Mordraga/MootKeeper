// storage.js

const API_BASE = "https://streamernetworkfastapi-production.up.railway.app";
const CATEGORIES_KEY = "streamCategories";

const DEFAULT_CATEGORIES = {
  relationships: ["Collab", "Artist", "Friend", "Mod", "Viewer", "Other"],
  tags: ["chaotic", "feral", "cozy", "horror", "wholesome", "nsfw"]
};

// =============================
// CONTACTS (API)
// =============================

export async function loadContacts() {
  try {
    const res = await fetch(`${API_BASE}/contacts`);
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
      headers: { "Content-Type": "application/json" },
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
      headers: { "Content-Type": "application/json" },
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
      method: "DELETE"
    });
    if (!res.ok) throw new Error("Failed to delete contact");
    return await res.json();
  } catch (err) {
    console.error("deleteContact error:", err);
  }
}

// =============================
// CATEGORIES (localStorage - user-local config)
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
