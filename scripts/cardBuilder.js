// cardBuilder.js

import { updateContact, deleteContact, normalizeUrl } from "./contacts.js";
import { loadCategories } from "./categoryStore.js";
import { clear, button, select, makeCollapsible } from "./ui.js";
import { createAvailabilitySection, renderAvailabilityDisplay } from "./availability.js";

export function renderCard(data, parent, onReload) {
  const card = document.createElement("div");
  card.className = "contact-card";
  renderReadonlyCard(card, data, onReload);
  parent.appendChild(card);
}

function renderReadonlyCard(card, data, onReload) {
  clear(card);

  const { relationship, links = [], keywords = [], availability, name, pronouns = "" } = data;

  const header = document.createElement("div");
  header.className = "card-header";

  const title = document.createElement("h4");
  title.style.cursor = "pointer";

  if (pronouns) {
    title.textContent = `${name} `;
    const pronSpan = document.createElement("span");
    pronSpan.className = "pronouns-badge";
    pronSpan.textContent = `(${pronouns})`;
    title.appendChild(pronSpan);
  } else {
    title.textContent = name;
  }

  const actions = document.createElement("div");
  actions.className = "card-actions";

  const editBtn = button("Edit", () => renderInlineEditor(card, data, onReload), "btn-sm");
  const delBtn = button("Delete", async () => {
    if (confirm(`Delete ${name}?`)) {
      await deleteContact(data.id);
      onReload();
    }
  }, "btn-sm btn-danger");

  actions.append(editBtn, delBtn);
  header.append(title, actions);

  const body = document.createElement("div");
  body.className = "card-body";

  const toggleCollapse = makeCollapsible(body, { collapsed: true });
  title.addEventListener("click", toggleCollapse);

  if (relationship) {
    const badge = document.createElement("span");
    badge.className = "relationship-badge";
    badge.textContent = relationship;
    body.appendChild(badge);
  }

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

function renderInlineEditor(card, data, onReload) {
  clear(card);
  card.classList.add("editing");

  const cats = loadCategories();

  const nameInput = document.createElement("input");
  nameInput.value = data.name;
  nameInput.placeholder = "Name";
  nameInput.className = "edit-input";

  const pronounsInput = document.createElement("input");
  pronounsInput.value = data.pronouns || "";
  pronounsInput.placeholder = "Pronouns (e.g. she/her)";
  pronounsInput.className = "edit-input";

  const relEl = select(["", ...cats.relationships], data.relationship || "");
  relEl.className = "edit-select";

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

      groupLabel.addEventListener("click", () => groupSection.classList.toggle("collapsed"));

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

    await updateContact(data.id, {
      name: nameInput.value.trim(),
      pronouns: pronounsInput.value.trim(),
      relationship: relEl.value,
      keywords: editKeywords,
      links,
      availability: availGetData ? availGetData() : null
    });

    onReload();
  }, "btn-primary");

  const cancelBtn = button("Cancel", () => onReload(), "btn-sm");

  card.append(nameInput, pronounsInput, relEl, keyWrap, linksWrap, addLinkBtn, availWrap, saveBtn, cancelBtn);
}
