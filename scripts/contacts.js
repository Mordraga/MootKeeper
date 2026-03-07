// contacts.js

import { API_BASE, isLoggedIn, authHeaders, clearToken } from "./auth.js";

const LOCAL_CONTACTS_KEY = "local_contacts";

export function normalizeUrl(raw) {
  if (!raw) return "";
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(raw)) return raw;
  return "https://" + raw.trim();
}

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
    const contact = { ...data, id: genLocalId(), updatedAt: new Date().toISOString() };
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
      contacts[idx] = { ...contacts[idx], ...updated, updatedAt: new Date().toISOString() };
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
