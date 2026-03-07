// contactForm.js

import { addContact, normalizeUrl } from "./contacts.js";
import { loadCategories } from "./categoryStore.js";
import { qs, clear, button, select } from "./ui.js";
import { createAvailabilitySection } from "./availability.js";

const form = qs("contact-form");
const addLinkBtn = qs("add-link");
const linksContainer = qs("links-container");
const nameInput = qs("name");
const pronounsInput = qs("pronouns");
const relContainer = qs("relationship-container");
const keywordsContainer = qs("keywords-container");

let relSelect = null;
let selectedKeywords = [];
let currentAvailability = null;

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
      const visible = Array.isArray(groupTags)
        ? groupTags.filter(t => !selectedKeywords.includes(t))
        : [];

      if (!visible.length) return;

      const groupSection = document.createElement("div");
      groupSection.className = "tag-group";

      const groupLabel = document.createElement("span");
      groupLabel.className = "tag-group-label";
      groupLabel.textContent = group;

      const groupContent = document.createElement("div");
      groupContent.className = "tag-group-content";

      groupLabel.addEventListener("click", () => groupSection.classList.toggle("collapsed"));

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
        groupContent.appendChild(span);
      });

      groupSection.append(groupLabel, groupContent);
      available.appendChild(groupSection);
    });
  }

  refreshSelected();
  refreshAvailable();
  wrap.append(selected, available);
  return wrap;
}

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

export function rebuildFormDropdowns(currentRel = "", currentKeywords = [], availData = null) {
  if (relContainer) {
    clear(relContainer);
    relSelect = buildRelSelect(currentRel);
    relContainer.appendChild(relSelect);
  }

  if (keywordsContainer) {
    clear(keywordsContainer);
    keywordsContainer.appendChild(buildKeywordSelector(currentKeywords));
  }

  const availContainer = qs("availability-container");
  if (availContainer) {
    clear(availContainer);
    const { el, getData } = createAvailabilitySection(availData);
    availContainer.appendChild(el);
    currentAvailability = getData;
  }
}

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
    pronouns: pronounsInput ? pronounsInput.value.trim() : "",
    relationship: relSelect ? relSelect.value : "",
    keywords: [...selectedKeywords],
    links,
    availability: currentAvailability ? currentAvailability() : null
  };
}

function resetForm() {
  nameInput.value = "";
  if (pronounsInput) pronounsInput.value = "";
  selectedKeywords = [];
  ensureOneLinkPair();
  rebuildFormDropdowns();
}

export function initContactForm(onContactAdded) {
  ensureOneLinkPair();
  rebuildFormDropdowns();

  addLinkBtn.addEventListener("click", () => {
    linksContainer.appendChild(createLinkPair());
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const data = collectFormData();

    if (!data.name) {
      alert("Name is required");
      return;
    }

    await addContact(data);
    resetForm();
    onContactAdded();
  });
}
