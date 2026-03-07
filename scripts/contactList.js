// contactList.js

import { loadContacts } from "./contacts.js";
import { loadCategories } from "./categoryStore.js";
import { qs, clear, makeCollapsible, createFilterBar } from "./ui.js";
import { renderCard } from "./cardBuilder.js";

const eventHolder = qs("event-holder");

let activeFilter = { search: "", relationship: "" };
let _filterBar = null;

function contactMatchesFilter(contact) {
  const { search, relationship } = activeFilter;

  if (relationship && contact.relationship !== relationship) return false;

  if (search) {
    const haystack = [
      contact.name,
      contact.relationship,
      ...(contact.keywords || [])
    ].join(" ").toLowerCase();
    if (!haystack.includes(search)) return false;
  }

  return true;
}

export function initFilterBar() {
  const cats = loadCategories();
  const { bar, updateRelationships } = createFilterBar(
    cats.relationships,
    (filter) => {
      activeFilter = filter;
      renderAllContacts();
    }
  );
  _filterBar = { bar, updateRelationships };
  eventHolder.parentNode.insertBefore(bar, eventHolder);
}

export function updateFilterRelationships(rels) {
  if (_filterBar) _filterBar.updateRelationships(rels);
}

export async function renderAllContacts() {
  clear(eventHolder);
  const loading = document.createElement("p");
  loading.className = "empty-state";
  loading.textContent = "Loading...";
  eventHolder.appendChild(loading);

  const contacts = await loadContacts();
  clear(eventHolder);

  const groups = {};
  contacts.forEach(entry => {
    if (!contactMatchesFilter(entry)) return;
    const group = entry.relationship || "Uncategorized";
    if (!groups[group]) groups[group] = [];
    groups[group].push(entry);
  });

  if (Object.keys(groups).length === 0) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = "No contacts found.";
    eventHolder.appendChild(empty);
    return;
  }

  Object.entries(groups).forEach(([groupName, items]) => {
    const section = document.createElement("div");
    section.className = "contact-group";

    const header = document.createElement("h3");
    header.className = "group-header";
    header.textContent = `${groupName} (${items.length})`;

    const toggleGroup = makeCollapsible(section, { collapsed: false });
    header.addEventListener("click", toggleGroup);

    section.appendChild(header);
    items.forEach(entry => renderCard(entry, section, renderAllContacts));
    eventHolder.appendChild(section);
  });
}
