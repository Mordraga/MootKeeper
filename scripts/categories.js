// categories.js
// Handles the category manager modal for relationships and tags

import {
  loadCategories,
  addRelationship,
  removeRelationship,
  addTag,
  removeTag
} from "./storage.js";

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
    loadCategories().tags.forEach(t => {
      tagTags.appendChild(tag(t, (name) => {
        removeTag(name);
        refreshTags();
        if (onUpdate) onUpdate();
      }));
    });
  }
  refreshTags();

  const tagInputWrap = document.createElement("div");
  tagInputWrap.className = "cat-add-row";

  const tagInput = document.createElement("input");
  tagInput.type = "text";
  tagInput.placeholder = "Add tag...";

  const tagAddBtn = button("Add", () => {
    if (addTag(tagInput.value)) {
      tagInput.value = "";
      refreshTags();
      if (onUpdate) onUpdate();
    }
  });

  tagInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") tagAddBtn.click();
  });

  tagInputWrap.append(tagInput, tagAddBtn);
  tagSection.append(tagTitle, tagTags, tagInputWrap);

  body.append(relSection, tagSection);
}