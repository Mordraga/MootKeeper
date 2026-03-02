// availability.js
// Availability form section and card display component

import {
  COMMON_TIMEZONES,
  PERIODS,
  DAYS,
  loadUserTimezone,
  getTzAbbr,
  getCurrentTimeInTz,
  convertRange
} from "./timezone.js";

// ========== FORM SECTION ==========

export function createAvailabilitySection(initial = null) {
  const wrap = document.createElement("div");
  wrap.className = "availability-section";

  const toggle = document.createElement("button");
  toggle.type = "button";
  toggle.className = "availability-toggle";
  toggle.textContent = "＋ Add Availability";

  const content = document.createElement("div");
  content.className = "availability-content collapsed";

  let isOpen = false;
  toggle.addEventListener("click", () => {
    isOpen = !isOpen;
    content.classList.toggle("collapsed", !isOpen);
    toggle.textContent = isOpen ? "－ Availability" : "＋ Add Availability";
  });

  // Timezone input + datalist
  const tzLabel = document.createElement("label");
  tzLabel.textContent = "Their Timezone";

  const datalistId = `tz-options-${Math.random().toString(36).slice(2, 7)}`;

  const tzInput = document.createElement("input");
  tzInput.type = "text";
  tzInput.placeholder = "Search timezone...";
  tzInput.setAttribute("list", datalistId);

  const tzDatalist = document.createElement("datalist");
  tzDatalist.id = datalistId;
  COMMON_TIMEZONES.forEach(({ label }) => {
    const opt = document.createElement("option");
    opt.value = label;
    tzDatalist.appendChild(opt);
  });

  function getSelectedTz() {
    const match = COMMON_TIMEZONES.find(t => t.label === tzInput.value.trim());
    return match ? match.iana : "";
  }

  // ========== Days toggle buttons ==========
  const selectedDays = new Set();
  const selectedPeriods = new Set();

  const daysLabel = document.createElement("label");
  daysLabel.textContent = "Days";

  const daysGroup = document.createElement("div");
  daysGroup.className = "toggle-group";

  DAYS.forEach(({ id, label }) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "toggle-btn";
    btn.textContent = label;
    btn.addEventListener("click", () => {
      if (selectedDays.has(id)) {
        selectedDays.delete(id);
        btn.classList.remove("active");
      } else {
        selectedDays.add(id);
        btn.classList.add("active");
      }
    });
    daysGroup.appendChild(btn);
  });

  // ========== Periods toggle buttons ==========
  const periodsLabel = document.createElement("label");
  periodsLabel.textContent = "Time of Day";

  const periodsGroup = document.createElement("div");
  periodsGroup.className = "toggle-group";

  PERIODS.forEach(({ id, label }) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "toggle-btn";
    btn.textContent = label;
    btn.addEventListener("click", () => {
      if (selectedPeriods.has(id)) {
        selectedPeriods.delete(id);
        btn.classList.remove("active");
      } else {
        selectedPeriods.add(id);
        btn.classList.add("active");
      }
    });
    periodsGroup.appendChild(btn);
  });

  // Hour range (optional)
  const hoursLabel = document.createElement("label");
  hoursLabel.textContent = "Active Hours (optional)";

  const hoursWrap = document.createElement("div");
  hoursWrap.className = "hour-range-wrap";

  const fromInput = document.createElement("input");
  fromInput.type = "text";
  fromInput.placeholder = "From: 10PM or 22:00";
  fromInput.className = "hour-input";

  const toInput = document.createElement("input");
  toInput.type = "text";
  toInput.placeholder = "To: 3AM or 03:00";
  toInput.className = "hour-input";

  const rangeHint = document.createElement("span");
  rangeHint.className = "range-hint";

  function updateRangeHint() {
    const tz = getSelectedTz();
    const userTz = loadUserTimezone();
    if (!tz || !fromInput.value || !toInput.value || tz === userTz) {
      rangeHint.textContent = "";
      return;
    }
    const result = convertRange(fromInput.value, toInput.value, tz, userTz);
    rangeHint.textContent = result ? `→ ${result.from} - ${result.to} your time` : "";
  }

  fromInput.addEventListener("input", updateRangeHint);
  toInput.addEventListener("input", updateRangeHint);
  tzInput.addEventListener("input", updateRangeHint);

  hoursWrap.append(fromInput, toInput, rangeHint);
  content.append(tzLabel, tzInput, tzDatalist, daysLabel, daysGroup, periodsLabel, periodsGroup, hoursLabel, hoursWrap);
  wrap.append(toggle, content);

  // ========== Data helpers ==========

  function getData() {
    const tz = getSelectedTz();
    const slots = [];
    selectedDays.forEach(dayId => {
      selectedPeriods.forEach(periodId => slots.push(`${dayId}_${periodId}`));
    });
    const hours = (fromInput.value || toInput.value) ? {
      from: fromInput.value.trim(),
      to: toInput.value.trim()
    } : null;

    if (!tz && !slots.length && !hours) return null;
    return { timezone: tz || null, slots, hours };
  }

  function setData(data) {
    if (!data) return;

    isOpen = true;
    content.classList.remove("collapsed");
    toggle.textContent = "－ Availability";

    if (data.timezone) {
      const match = COMMON_TIMEZONES.find(t => t.iana === data.timezone);
      tzInput.value = match ? match.label : "";
    }

    // Normalize to slots
    const slotsToSet = [];
    if (data.slots) {
      slotsToSet.push(...data.slots);
    } else if (data.days && data.periods) {
      data.days.forEach(dayId => {
        data.periods.forEach(periodId => slotsToSet.push(`${dayId}_${periodId}`));
      });
    }

    // Extract unique days and periods from slots
    slotsToSet.forEach(slot => {
      const [dayId, periodId] = slot.split("_");
      selectedDays.add(dayId);
      selectedPeriods.add(periodId);
    });

    // Update day buttons
    daysGroup.querySelectorAll(".toggle-btn").forEach(btn => {
      const day = DAYS.find(d => d.label === btn.textContent);
      if (day && selectedDays.has(day.id)) btn.classList.add("active");
    });

    // Update period buttons
    periodsGroup.querySelectorAll(".toggle-btn").forEach(btn => {
      const period = PERIODS.find(p => p.label === btn.textContent);
      if (period && selectedPeriods.has(period.id)) btn.classList.add("active");
    });

    if (data.hours) {
      fromInput.value = data.hours.from || "";
      toInput.value = data.hours.to || "";
      updateRangeHint();
    }
  }

  if (initial) setData(initial);

  return { el: wrap, getData, setData };
}

// ========== CARD DISPLAY ==========

export function renderAvailabilityDisplay(availability) {
  if (!availability) return null;

  // Normalize to slot set — handles both new (slots[]) and old (days+periods) formats
  const slotSet = new Set();
  if (availability.slots) {
    availability.slots.forEach(s => slotSet.add(s));
  } else if (availability.days && availability.periods) {
    availability.days.forEach(d =>
      availability.periods.forEach(p => slotSet.add(`${d}_${p}`))
    );
  }

  const { timezone, hours = null } = availability;
  if (!timezone && !slotSet.size && !hours) return null;

  const userTz = loadUserTimezone();
  const wrap = document.createElement("div");
  wrap.className = "availability-display";

  const title = document.createElement("strong");
  title.textContent = "Availability";
  wrap.appendChild(title);

  // Live clock
  if (timezone) {
    const clockRow = document.createElement("div");
    clockRow.className = "avail-clock";

    function updateClock() {
      clockRow.textContent = `🕐 Now: ${getCurrentTimeInTz(timezone)} ${getTzAbbr(timezone)}`;
    }
    updateClock();
    const interval = setInterval(updateClock, 30000);
    const observer = new MutationObserver(() => {
      if (!wrap.isConnected) { clearInterval(interval); observer.disconnect(); }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    wrap.appendChild(clockRow);
  }

  // Mini grid — only rows with at least one selected slot
  if (slotSet.size > 0) {
    const table = document.createElement("table");
    table.className = "avail-grid avail-grid-readonly";

    const thead = document.createElement("thead");
    const headerRow = document.createElement("tr");
    headerRow.appendChild(document.createElement("th"));
    DAYS.forEach(({ label }) => {
      const th = document.createElement("th");
      th.textContent = label[0]; // single letter
      headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    const tbody = document.createElement("tbody");
    PERIODS.forEach(({ id: periodId, label: periodLabel }) => {
      if (!DAYS.some(({ id: dayId }) => slotSet.has(`${dayId}_${periodId}`))) return;

      const row = document.createElement("tr");
      const th = document.createElement("th");
      th.textContent = periodLabel.slice(0, 3);
      row.appendChild(th);

      DAYS.forEach(({ id: dayId }) => {
        const td = document.createElement("td");
        td.className = "avail-cell";
        if (slotSet.has(`${dayId}_${periodId}`)) td.classList.add("active");
        row.appendChild(td);
      });

      tbody.appendChild(row);
    });
    table.appendChild(tbody);
    wrap.appendChild(table);
  }

  // Hours range
  if (hours && (hours.from || hours.to)) {
    const rangeRow = document.createElement("div");
    rangeRow.className = "avail-periods";

    const theirSpan = document.createElement("span");
    theirSpan.className = "avail-their";
    theirSpan.textContent = `${hours.from} - ${hours.to} their time`;
    rangeRow.appendChild(theirSpan);

    if (timezone && timezone !== userTz) {
      const result = convertRange(hours.from, hours.to, timezone, userTz);
      if (result) {
        const yourSpan = document.createElement("span");
        yourSpan.className = "avail-yours";
        yourSpan.textContent = `→ ${result.from} - ${result.to} your time`;
        rangeRow.appendChild(yourSpan);
      }
    }

    wrap.appendChild(rangeRow);
  }

  return wrap;
}
