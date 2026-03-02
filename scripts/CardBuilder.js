// CardBuilder.js

import {
  loadContacts,
  addContact,
  updateContact,
  deleteContact,
  loadCategories,
  isLoggedIn,
  loginWithTwitch,
  logout,
  handleCallback,
  loadUserInfo
} from "./storage.js";


import {
  qs,
  clear,
  button,
  select,
  makeCollapsible,
  createSidePanel,
  createFilterBar,
  createModal
} from "./ui.js";

import { openCategoryManager } from "./categories.js";
import { createAvailabilitySection, renderAvailabilityDisplay } from "./availability.js";
import { loadUserTimezone, saveUserTimezone, COMMON_TIMEZONES, detectTimezone } from "./timezone.js";

// ========== DOM ==========
const form = qs("contact-form");
const eventHolder = qs("event-holder");
const addLinkBtn = qs("add-link");
const linksContainer = qs("links-container");
const nameInput = qs("name");

// Relationship dropdown - replaces text input
const relContainer = qs("relationship-container");
let relSelect = null;

// Keywords tag selector
const keywordsContainer = qs("keywords-container");
let selectedKeywords = [];

// Availability section tracker
let currentAvailability = null;

// Filter state
let activeFilter = { search: "", relationship: "" };

// ========== Auth Card ==========
function buildAuthCard() {
  const card = document.createElement("div");
  card.className = "auth-card";

  if (isLoggedIn()) {
    const loading = document.createElement("p");
    loading.className = "auth-name";
    loading.textContent = "Loading...";
    card.appendChild(loading);

    loadUserInfo().then(data => {
      clear(card);

      const img = document.createElement("img");
      img.src = data.profile_image_url;
      img.alt = data.display_name;
      img.className = "auth-pfp";

      const name = document.createElement("p");
      name.className = "auth-name";
      name.textContent = `@${data.display_name}`;

      const logoutBtn = button("Logout", logout, "btn-sm");

      card.append(img, name, logoutBtn);
    }).catch(() => logout());
  } else {
    const prompt = document.createElement("p");
    prompt.className = "auth-prompt";
    prompt.textContent = "Login to sync contacts across devices";

    const loginBtn = button("Login with Twitch", loginWithTwitch, "btn-primary");
    loginBtn.style.width = "100%";

    card.append(prompt, loginBtn);
  }

  return card;
}

// ========== Init Side Panel ==========
function initSidePanel() {
  const { panel, inner } = createSidePanel([
    {
      label: "Categories",
      icon: "🗂",
      onClick: () => openCategoryManager(() => {
        rebuildFormDropdowns();
        filterBar.updateRelationships(loadCategories().relationships);
        renderAllContacts();
      })
    },
    {
      label: "My Timezone",
      icon: "🕐",
      onClick: () => openTimezoneModal()
    }
  ]);

  inner.appendChild(buildAuthCard());
  document.body.insertBefore(panel, document.body.firstChild);
}

// ========== TIMEZONE MODAL ==========
function openTimezoneModal() {
  const current = loadUserTimezone();
  const detected = detectTimezone();

  createModal("My Timezone", (body) => {
    const info = document.createElement("p");
    info.className = "tz-detected";
    info.textContent = `Auto-detected: ${detected}`;
    body.appendChild(info);

    const tzSelect = document.createElement("select");
    tzSelect.className = "tz-select";

    const autoOpt = document.createElement("option");
    autoOpt.value = detected;
    autoOpt.textContent = `Auto (${detected})`;
    tzSelect.appendChild(autoOpt);

    COMMON_TIMEZONES.forEach(({ label, iana }) => {
      const opt = document.createElement("option");
      opt.value = iana;
      opt.textContent = label;
      if (iana === current) opt.selected = true;
      tzSelect.appendChild(opt);
    });

    const saveBtn = button("Save", () => {
      saveUserTimezone(tzSelect.value);
      renderAllContacts();
      document.querySelector(".modal-overlay")?.remove();
    }, "btn-primary");
    saveBtn.style.width = "100%";
    saveBtn.style.marginTop = "0.75rem";

    body.append(tzSelect, saveBtn);
  });
}
let filterBar;

function initFilterBar() {
  const cats = loadCategories();
  const { bar, updateRelationships } = createFilterBar(
    cats.relationships,
    (filter) => {
      activeFilter = filter;
      renderAllContacts();
    }
  );
  filterBar = { bar, updateRelationships };
  eventHolder.parentNode.insertBefore(bar, eventHolder);
}

// ========== Form Dropdowns ==========
function buildRelSelect(current = "") {
  const cats = loadCategories();
  const el = select(["", ...cats.relationships], current);
  el.id = "relationship";
  el.name = "relationship";
  return el;
}

function buildKeywordSelector(current = []) {
  const cats = loadCategories();
  const wrap = document.createElement("div");
  wrap.className = "keyword-selector";

  selectedKeywords = [...current];

  const selected = document.createElement("div");
  selected.className = "selected-keywords";

  function refreshSelected() {
    clear(selected);
    selectedKeywords.forEach(k => {
      const span = document.createElement("span");
      span.className = "tag";
      span.textContent = k;

      const x = document.createElement("button");
      x.type = "button";
      x.className = "tag-remove";
      x.textContent = "×";
      x.addEventListener("click", () => {
        selectedKeywords = selectedKeywords.filter(kw => kw !== k);
        refreshSelected();
        refreshAvailable();
      });

      span.appendChild(x);
      selected.appendChild(span);
    });
  }

  const available = document.createElement("div");
  available.className = "available-keywords";

  function refreshAvailable() {
    clear(available);
    Object.entries(cats.tags).forEach(([group, groupTags]) => {
      const visible = Array.isArray(groupTags) ? groupTags.filter(t => !selectedKeywords.includes(t)) : [];
      if (!visible.length) return;
      const groupLabel = document.createElement("span");
      groupLabel.className = "tag-group-label";
      groupLabel.textContent = group;
      available.appendChild(groupLabel);
      visible.forEach(t => {
        const span = document.createElement("span");
        span.className = "tag tag-available";
        span.textContent = t;
        span.addEventListener("click", () => {
          if (!selectedKeywords.includes(t)) {
            selectedKeywords.push(t);
            refreshSelected();
            refreshAvailable();
          }
        });
        available.appendChild(span);
      });
    });
  }

  refreshSelected();
  refreshAvailable();
  wrap.append(selected, available);
  return wrap;
}

function rebuildFormDropdowns(currentRel = "", currentKeywords = [], availData = null) {
  // Relationship
  if (relContainer) {
    clear(relContainer);
    relSelect = buildRelSelect(currentRel);
    relContainer.appendChild(relSelect);
  }

  // Keywords
  if (keywordsContainer) {
    clear(keywordsContainer);
    keywordsContainer.appendChild(buildKeywordSelector(currentKeywords));
  }

  // Availability - inject after keywords-container
  const availContainer = qs("availability-container");
  if (availContainer) {
    clear(availContainer);
    const { el, getData } = createAvailabilitySection(availData);
    availContainer.appendChild(el);
    currentAvailability = getData;
  }
}

// ========== Helpers ==========
function normalizeUrl(raw) {
  if (!raw) return "";
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(raw)) return raw;
  return "https://" + raw.trim();
}

// ========== Form Link Pair ==========
function createLinkPair(labelVal = "", urlVal = "") {
  const pair = document.createElement("div");
  pair.className = "link-pair";

  const labelInput = document.createElement("input");
  labelInput.className = "link-label";
  labelInput.placeholder = "@name / Discord / Twitter";
  labelInput.value = labelVal;

  const urlInput = document.createElement("input");
  urlInput.className = "link-url";
  urlInput.placeholder = "URL";
  urlInput.value = urlVal;

  const removeBtn = button("×", () => {
    pair.remove();
    if (!linksContainer.querySelector(".link-pair")) {
      linksContainer.appendChild(createLinkPair());
    }
  }, "remove-link");

  pair.append(labelInput, urlInput, removeBtn);
  return pair;
}

function ensureOneLinkPair() {
  clear(linksContainer);
  linksContainer.appendChild(createLinkPair());
}

// ========== Form Handling ==========
function collectFormData() {
  const linkPairs = [...linksContainer.querySelectorAll(".link-pair")];
  const links = linkPairs
    .map(p => ({
      label: p.querySelector(".link-label").value.trim(),
      url: normalizeUrl(p.querySelector(".link-url").value.trim())
    }))
    .filter(l => l.label && l.url);

  return {
    name: nameInput.value.trim(),
    relationship: relSelect ? relSelect.value : "",
    keywords: [...selectedKeywords],
    links,
    availability: currentAvailability ? currentAvailability() : null
  };
}

function resetForm() {
  nameInput.value = "";
  selectedKeywords = [];
  ensureOneLinkPair();
  rebuildFormDropdowns();
}

// ========== Filter ==========
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

// ========== Render ==========
export async function renderAllContacts() {
  clear(eventHolder);
  const loading = document.createElement("p");
  loading.className = "empty-state";
  loading.textContent = "Loading...";
  eventHolder.appendChild(loading);
  const contacts = await loadContacts();
  clear(eventHolder);

  // Group by relationship
  const groups = {};
  contacts.forEach((entry, index) => {
    if (!contactMatchesFilter(entry)) return;
    const group = entry.relationship || "Uncategorized";
    if (!groups[group]) groups[group] = [];
    groups[group].push({ entry, index });
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
    items.forEach(({ entry, index }) => renderCard(entry, index, section));
    eventHolder.appendChild(section);
  });
}

function renderCard(data, index, parent) {
  const card = document.createElement("div");
  card.className = "contact-card";
  renderReadonlyCard(card, data, index);
  parent.appendChild(card);
}

// ========== Readonly Card ==========
function renderReadonlyCard(card, data, index) {
  clear(card);

  const relationship = data.relationship;
  const links = Array.isArray(data.links) ? data.links : [];
  const keywords = data.keywords || [];
  const availability = data.availability;
  const name = data.name;

  const header = document.createElement("div");
  header.className = "card-header";

  const title = document.createElement("h4");
  title.textContent = name;
  title.style.cursor = "pointer";

  const actions = document.createElement("div");
  actions.className = "card-actions";

  const editBtn = button("Edit", () => renderInlineEditor(card, data, data.id), "btn-sm");
  const delBtn = button("Delete", async () => {
    if (confirm(`Delete ${name}?`)) {
      await deleteContact(data.id);
      renderAllContacts();
    }
  }, "btn-sm btn-danger");

  actions.append(editBtn, delBtn);
  header.append(title, actions);

  const body = document.createElement("div");
  body.className = "card-body";

  const toggleCollapse = makeCollapsible(body, { collapsed: true });
  title.addEventListener("click", toggleCollapse);

  // Relationship badge
  if (relationship) {
    const badge = document.createElement("span");
    badge.className = "relationship-badge";
    badge.textContent = relationship;
    body.appendChild(badge);
  }

  // Links
  if (links.length) {
    const linksBlock = document.createElement("div");
    linksBlock.className = "links-block";
    const linksLabel = document.createElement("strong");
    linksLabel.textContent = "Links:";
    linksBlock.appendChild(linksLabel);

    links.forEach(({ label, url }) => {
      const a = document.createElement("a");
      a.href = url;
      a.textContent = label;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      const line = document.createElement("div");
      line.appendChild(a);
      linksBlock.appendChild(line);
    });
    body.appendChild(linksBlock);
  }

  // Keywords
  if (keywords.length) {
    const keyP = document.createElement("div");
    keyP.className = "keyword-tags";
    keywords.forEach(k => {
      const span = document.createElement("span");
      span.className = "tag";
      span.textContent = k;
      keyP.appendChild(span);
    });
    body.appendChild(keyP);
  }

  // Availability
  const availDisplay = renderAvailabilityDisplay(availability);
  if (availDisplay) body.appendChild(availDisplay);

  card.append(header, body);

  if (data.updatedAt) {
    const footer = document.createElement("div");
    footer.className = "card-footer";
    footer.textContent = `Updated ${new Date(data.updatedAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}`;
    card.appendChild(footer);
  }
}

// ========== Inline Editor ==========
function renderInlineEditor(card, data, index) {
  clear(card);
  card.classList.add("editing");

  const cats = loadCategories();

  const nameInput = document.createElement("input");
  nameInput.value = data.name;
  nameInput.placeholder = "Name";
  nameInput.className = "edit-input";

  // Relationship dropdown
  const relEl = select(["", ...cats.relationships], data.relationship || "");
  relEl.className = "edit-select";

  // Keywords
  let editKeywords = [...(data.keywords || [])];
  const keyWrap = document.createElement("div");
  keyWrap.className = "keyword-selector";

  const selKw = document.createElement("div");
  selKw.className = "selected-keywords";

  const availKw = document.createElement("div");
  availKw.className = "available-keywords";

  function refreshEditKw() {
    clear(selKw);
    editKeywords.forEach(k => {
      const span = document.createElement("span");
      span.className = "tag";
      span.textContent = k;
      const x = document.createElement("button");
      x.type = "button";
      x.className = "tag-remove";
      x.textContent = "×";
      x.addEventListener("click", () => {
        editKeywords = editKeywords.filter(kw => kw !== k);
        refreshEditKw();
      });
      span.appendChild(x);
      selKw.appendChild(span);
    });

    clear(availKw);
    Object.entries(cats.tags).forEach(([group, groupTags]) => {
      const visible = Array.isArray(groupTags)
        ? groupTags.filter(t => !editKeywords.includes(t))
        : [];

      if (!visible.length) return;

      const groupSection = document.createElement("div");
      groupSection.className = "tag-group";

      const groupLabel = document.createElement("span");
      groupLabel.className = "tag-group-label";
      groupLabel.textContent = group;

      const groupContent = document.createElement("div");
      groupContent.className = "tag-group-content";

      groupLabel.addEventListener("click", () => {
        groupSection.classList.toggle("collapsed");
      });

      visible.forEach(t => {
        const span = document.createElement("span");
        span.className = "tag tag-available";
        span.textContent = t;
        span.addEventListener("click", () => {
          if (!editKeywords.includes(t)) {
            editKeywords.push(t);
            refreshEditKw();
          }
        });
        groupContent.appendChild(span);
      });

      groupSection.append(groupLabel, groupContent);
      availKw.appendChild(groupSection);
    });
  }

  refreshEditKw();
  keyWrap.append(selKw, availKw);

  // Links
  const linksWrap = document.createElement("div");
  linksWrap.className = "inline-links";

  function addLinkRow(label = "", url = "") {
    const row = document.createElement("div");
    row.className = "link-pair";

    const labelInput = document.createElement("input");
    labelInput.value = label;
    labelInput.placeholder = "Label";

    const urlInput = document.createElement("input");
    urlInput.value = url;
    urlInput.placeholder = "URL";

    const removeBtn = button("×", () => row.remove(), "remove-link");
    row.append(labelInput, urlInput, removeBtn);
    linksWrap.appendChild(row);
  }

  if (data.links && data.links.length) {
    data.links.forEach(l => addLinkRow(l.label, l.url));
  } else {
    addLinkRow();
  }

  // Availability
  let availGetData = null;
  const availWrap = document.createElement("div");
  const { el: availEl, getData: getAvailData } = createAvailabilitySection(data.availability || null);
  availGetData = getAvailData;
  availWrap.appendChild(availEl);

  const addLinkBtn = button("+ Link", () => addLinkRow(), "btn-sm");

  const saveBtn = button("Save", async () => {
    const linkPairs = [...linksWrap.querySelectorAll(".link-pair")];
    const links = linkPairs
      .map(p => ({
        label: p.querySelectorAll("input")[0].value.trim(),
        url: normalizeUrl(p.querySelectorAll("input")[1].value.trim())
      }))
      .filter(l => l.label && l.url);

    await updateContact(index, {
      name: nameInput.value.trim(),
      relationship: relEl.value,
      keywords: editKeywords,
      links,
      availability: availGetData ? availGetData() : null
    });

    renderAllContacts();
  }, "btn-primary");

  const cancelBtn = button("Cancel", () => renderAllContacts(), "btn-sm");

  card.append(nameInput, relEl, keyWrap, linksWrap, addLinkBtn, availWrap, saveBtn, cancelBtn);
}

// ========== Form Submit ==========
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const data = collectFormData();

  if (!data.name) {
    alert("Name is required");
    return;
  }

  await addContact(data);
  resetForm();
  renderAllContacts();
});

addLinkBtn.addEventListener("click", () => {
  linksContainer.appendChild(createLinkPair());
});

// ========== Init ==========
handleCallback();
initSidePanel();
initFilterBar();
ensureOneLinkPair();
rebuildFormDropdowns();
renderAllContacts();