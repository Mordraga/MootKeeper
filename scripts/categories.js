// categories.js
// Handles the category manager modal for relationships and tags

import {
  loadCategories,
  addRelationship,
  removeRelationship,
  addTag,
  removeTag
} from "./categoryStore.js";

import { clear, button, createModal, tag } from "./ui.js";

export function openCategoryManager(onUpdate) {
  createModal("Manage Categories", (body) => {
    renderCategoryModal(body, onUpdate);
  });
}

function renderCategoryModal(body, onUpdate) {
  clear(body);
  const cats = loadCategories();

  // ========== Relationships ==========
  const relSection = document.createElement("div");
  relSection.className = "cat-section";

  const relTitle = document.createElement("h3");
  relTitle.textContent = "Relationships";

  const relTags = document.createElement("div");
  relTags.className = "cat-tags";

  function refreshRel() {
    clear(relTags);
    loadCategories().relationships.forEach(r => {
      relTags.appendChild(tag(r, (name) => {
        removeRelationship(name);
        refreshRel();
        if (onUpdate) onUpdate();
      }));
    });
  }
  refreshRel();

  const relInputWrap = document.createElement("div");
  relInputWrap.className = "cat-add-row";

  const relInput = document.createElement("input");
  relInput.type = "text";
  relInput.placeholder = "Add relationship type...";

  const relAddBtn = button("Add", () => {
    if (addRelationship(relInput.value)) {
      relInput.value = "";
      refreshRel();
      if (onUpdate) onUpdate();
    }
  });

  relInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") relAddBtn.click();
  });

  relInputWrap.append(relInput, relAddBtn);
  relSection.append(relTitle, relTags, relInputWrap);

  // ========== Tags ==========
  const tagSection = document.createElement("div");
  tagSection.className = "cat-section";

  const tagTitle = document.createElement("h3");
  tagTitle.textContent = "Tags";

  const tagTags = document.createElement("div");
  tagTags.className = "cat-tags";

  function refreshTags() {
    clear(tagTags);
    Object.entries(loadCategories().tags).forEach(([group, tags]) => {
      if (!Array.isArray(tags) || !tags.length) return;
      const groupLabel = document.createElement("span");
      groupLabel.className = "cat-group-label";
      groupLabel.textContent = group;
      tagTags.appendChild(groupLabel);
      tags.forEach(t => {
        tagTags.appendChild(tag(t, (name) => {
          removeTag(name);
          refreshTags();
          if (onUpdate) onUpdate();
        }));
      });
    });
  }
  refreshTags();

  const tagInputWrap = document.createElement("div");
  tagInputWrap.className = "cat-add-row";

  const tagInput = document.createElement("input");
  tagInput.type = "text";
  tagInput.placeholder = "Add tag...";

  const tagGroupSelect = document.createElement("select");
  tagGroupSelect.className = "cat-group-select";
  Object.keys(loadCategories().tags).forEach(g => {
    const opt = document.createElement("option");
    opt.value = g;
    opt.textContent = g;
    tagGroupSelect.appendChild(opt);
  });

  const tagAddBtn = button("Add", () => {
    if (addTag(tagInput.value, tagGroupSelect.value)) {
      tagInput.value = "";
      refreshTags();
      if (onUpdate) onUpdate();
    }
  });

  tagInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") tagAddBtn.click();
  });

  tagInputWrap.append(tagGroupSelect, tagInput, tagAddBtn);
  tagSection.append(tagTitle, tagTags, tagInputWrap);

  body.append(relSection, tagSection);
}