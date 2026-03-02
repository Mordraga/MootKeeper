// ui.js

export function qs(id) {
  return document.getElementById(id);
}

export function clear(el) {
  el.innerHTML = "";
}

export function button(label, onClick, className = "") {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.textContent = label;
  if (className) btn.className = className;
  btn.addEventListener("click", onClick);
  return btn;
}

export function input(value = "", options = {}) {
  const el = document.createElement("input");
  el.value = value;
  Object.assign(el, options);
  return el;
}

export function select(options = [], selected = "") {
  const el = document.createElement("select");
  options.forEach(opt => {
    const o = document.createElement("option");
    o.value = opt;
    o.textContent = opt;
    if (opt === selected) o.selected = true;
    el.appendChild(o);
  });
  return el;
}

export function tag(text, onRemove = null) {
  const span = document.createElement("span");
  span.className = "tag";
  span.textContent = text;

  if (onRemove) {
    const x = document.createElement("button");
    x.type = "button";
    x.className = "tag-remove";
    x.textContent = "×";
    x.addEventListener("click", () => onRemove(text));
    span.appendChild(x);
  }

  return span;
}

// Generic collapsible helper
export function makeCollapsible(container, { collapsed = false, className = "collapsed" } = {}) {
  if (collapsed) container.classList.add(className);

  return function toggle(force) {
    if (typeof force === "boolean") {
      container.classList.toggle(className, !force);
    } else {
      container.classList.toggle(className);
    }
  };
}

// Modal helper
export function createModal(title, contentFn) {
  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";

  const modal = document.createElement("div");
  modal.className = "modal";

  const header = document.createElement("div");
  header.className = "modal-header";

  const h2 = document.createElement("h2");
  h2.textContent = title;

  const closeBtn = button("×", () => overlay.remove(), "modal-close");

  header.append(h2, closeBtn);

  const body = document.createElement("div");
  body.className = "modal-body";
  contentFn(body);

  modal.append(header, body);
  overlay.appendChild(modal);

  // Close on outside tap - mobile friendly
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) overlay.remove();
  });

  document.body.appendChild(overlay);
  return overlay;
}

// Side panel builder
export function createSidePanel(tools = []) {
  const panel = document.createElement("div");
  panel.className = "side-panel collapsed";
  panel.id = "side-panel";

  const toggle = document.createElement("button");
  toggle.className = "side-panel-toggle";
  toggle.type = "button";
  toggle.setAttribute("aria-label", "Toggle panel");
  toggle.textContent = "›";

  toggle.addEventListener("click", () => {
    const isCollapsed = panel.classList.toggle("collapsed");
    toggle.textContent = isCollapsed ? "›" : "‹";
  });

  const inner = document.createElement("div");
  inner.className = "side-panel-inner";

  const title = document.createElement("h3");
  title.textContent = "Tools";
  inner.appendChild(title);

  tools.forEach(({ label, icon, onClick }) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "side-tool-btn";
    btn.innerHTML = `<span class="tool-icon">${icon}</span><span class="tool-label">${label}</span>`;
    btn.addEventListener("click", onClick);
    inner.appendChild(btn);
  });

  panel.append(toggle, inner);
  return { panel, inner };
}

// Filter/sort bar
export function createFilterBar(relationships = [], onFilter) {
  const bar = document.createElement("div");
  bar.className = "filter-bar";

  const searchInput = document.createElement("input");
  searchInput.type = "search";
  searchInput.placeholder = "Search contacts...";
  searchInput.className = "filter-search";

  const relSelect = document.createElement("select");
  relSelect.className = "filter-select";

  const allOpt = document.createElement("option");
  allOpt.value = "";
  allOpt.textContent = "All Relationships";
  relSelect.appendChild(allOpt);

  relationships.forEach(r => {
    const opt = document.createElement("option");
    opt.value = r;
    opt.textContent = r;
    relSelect.appendChild(opt);
  });

  function emitFilter() {
    onFilter({
      search: searchInput.value.trim().toLowerCase(),
      relationship: relSelect.value
    });
  }

  searchInput.addEventListener("input", emitFilter);
  relSelect.addEventListener("change", emitFilter);

  bar.append(searchInput, relSelect);
  return { bar, updateRelationships: (rels) => {
    const current = relSelect.value;
    clear(relSelect);
    relSelect.appendChild(allOpt);
    rels.forEach(r => {
      const opt = document.createElement("option");
      opt.value = r;
      opt.textContent = r;
      if (r === current) opt.selected = true;
      relSelect.appendChild(opt);
    });
  }};
}