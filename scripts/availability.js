// availability.js
// Availability form section and card display component

import {
  COMMON_TIMEZONES,
  PERIODS,
  DAYS,
  loadUserTimezone,
  convertPeriod,
  getTzAbbr,
  getTzLabel,
  getCurrentTimeInTz,
  convertRange
} from "./timezone.js";

import { button, clear } from "./ui.js";

// ========== FORM SECTION ==========

/**
 * Creates a collapsible availability section for the add/edit form.
 * Returns { el, getData, setData }
 */
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

  // Timezone select
  const tzLabel = document.createElement("label");
  tzLabel.textContent = "Their Timezone";

  const tzSelect = document.createElement("select");
  tzSelect.className = "tz-select";

  const emptyOpt = document.createElement("option");
  emptyOpt.value = "";
  emptyOpt.textContent = "Select timezone...";
  tzSelect.appendChild(emptyOpt);

  COMMON_TIMEZONES.forEach(({ label, iana }) => {
    const opt = document.createElement("option");
    opt.value = iana;
    opt.textContent = label;
    tzSelect.appendChild(opt);
  });

  // Active periods
  const periodsLabel = document.createElement("label");
  periodsLabel.textContent = "Active Periods";

  const periodsWrap = document.createElement("div");
  periodsWrap.className = "toggle-group";

  const periodState = {};
  PERIODS.forEach(({ id, label }) => {
    periodState[id] = false;

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "toggle-btn";
    btn.textContent = label;
    btn.dataset.id = id;

    btn.addEventListener("click", () => {
      periodState[id] = !periodState[id];
      btn.classList.toggle("active", periodState[id]);
    });

    periodsWrap.appendChild(btn);
  });

  // Active days
  const daysLabel = document.createElement("label");
  daysLabel.textContent = "Available Days";

  const daysWrap = document.createElement("div");
  daysWrap.className = "toggle-group";

  const dayState = {};
  DAYS.forEach(({ id, label }) => {
    dayState[id] = false;

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "toggle-btn";
    btn.textContent = label;
    btn.dataset.id = id;

    btn.addEventListener("click", () => {
      dayState[id] = !dayState[id];
      btn.classList.toggle("active", dayState[id]);
    });

    daysWrap.appendChild(btn);
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
    const tz = tzSelect.value;
    const userTz = loadUserTimezone();
    if (!tz || !fromInput.value || !toInput.value || tz === userTz) {
      rangeHint.textContent = "";
      return;
    }
    const result = convertRange(fromInput.value, toInput.value, tz, userTz);
    if (result) {
      rangeHint.textContent = `→ ${result.from} - ${result.to} your time`;
    } else {
      rangeHint.textContent = "";
    }
  }

  fromInput.addEventListener("input", updateRangeHint);
  toInput.addEventListener("input", updateRangeHint);
  tzSelect.addEventListener("change", updateRangeHint);

  hoursWrap.append(fromInput, toInput, rangeHint);

  content.append(tzLabel, tzSelect, periodsLabel, periodsWrap, daysLabel, daysWrap, hoursLabel, hoursWrap);
  wrap.append(toggle, content);

  // ========== Data helpers ==========

  function getData() {
    const tz = tzSelect.value;
    const periods = Object.entries(periodState).filter(([,v]) => v).map(([k]) => k);
    const days = Object.entries(dayState).filter(([,v]) => v).map(([k]) => k);
    const hours = (fromInput.value || toInput.value) ? {
      from: fromInput.value.trim(),
      to: toInput.value.trim()
    } : null;

    if (!tz && periods.length === 0 && days.length === 0 && !hours) return null;
    return { timezone: tz || null, periods, days, hours };
  }

  function setData(data) {
    if (!data) return;

    isOpen = true;
    content.classList.remove("collapsed");
    toggle.textContent = "－ Availability";

    if (data.timezone) tzSelect.value = data.timezone;

    if (data.periods) {
      data.periods.forEach(id => {
        periodState[id] = true;
        const btn = periodsWrap.querySelector(`[data-id="${id}"]`);
        if (btn) btn.classList.add("active");
      });
    }

    if (data.days) {
      data.days.forEach(id => {
        dayState[id] = true;
        const btn = daysWrap.querySelector(`[data-id="${id}"]`);
        if (btn) btn.classList.add("active");
      });
    }

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

/**
 * Renders availability info on a readonly card.
 * Shows their timezone + periods, then converted local time below.
 */
export function renderAvailabilityDisplay(availability) {
  if (!availability) return null;

  const { timezone, periods = [], days = [], hours = null } = availability;
  if (!timezone && periods.length === 0 && days.length === 0 && !hours) return null;

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
      const time = getCurrentTimeInTz(timezone);
      const abbr = getTzAbbr(timezone);
      clockRow.textContent = `🕐 Now: ${time} ${abbr}`;
    }
    updateClock();
    // Update every 30 seconds, close enough
    const interval = setInterval(updateClock, 30000);
    // Clean up when card is removed
    const observer = new MutationObserver(() => {
      if (!wrap.isConnected) {
        clearInterval(interval);
        observer.disconnect();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });

    wrap.appendChild(clockRow);
  }

  // Timezone row
  if (timezone) {
    const tzRow = document.createElement("div");
    tzRow.className = "avail-tz-row";
    const theirAbbr = getTzAbbr(timezone);
    const yourAbbr = getTzAbbr(userTz);
    const sameZone = timezone === userTz;
    tzRow.textContent = sameZone
      ? `Timezone: ${theirAbbr}`
      : `Timezone: ${theirAbbr} → your ${yourAbbr}`;
    wrap.appendChild(tzRow);
  }

  // Hour range
  if (hours && (hours.from || hours.to) && timezone && timezone !== userTz) {
    const rangeRow = document.createElement("div");
    rangeRow.className = "avail-periods";

    const theirSpan = document.createElement("span");
    theirSpan.className = "avail-their";
    theirSpan.textContent = `${hours.from} - ${hours.to} their time`;
    rangeRow.appendChild(theirSpan);

    const result = convertRange(hours.from, hours.to, timezone, userTz);
    if (result) {
      const yourSpan = document.createElement("span");
      yourSpan.className = "avail-yours";
      yourSpan.textContent = `→ ${result.from} - ${result.to} your time`;
      rangeRow.appendChild(yourSpan);
    }

    wrap.appendChild(rangeRow);
  }

  // Periods
  if (periods.length > 0) {
    const periodsRow = document.createElement("div");
    periodsRow.className = "avail-periods";

    const theirLabels = periods.map(id => PERIODS.find(p => p.id === id)?.label).filter(Boolean);
    const theirSpan = document.createElement("span");
    theirSpan.className = "avail-their";
    theirSpan.textContent = theirLabels.join(", ");
    periodsRow.appendChild(theirSpan);

    if (timezone && timezone !== userTz) {
      const converted = [...new Set(
        periods.map(id => convertPeriod(id, timezone, userTz)).filter(Boolean)
      )];
      if (converted.length > 0) {
        const yourSpan = document.createElement("span");
        yourSpan.className = "avail-yours";
        yourSpan.textContent = `→ ${converted.join(", ")} your time`;
        periodsRow.appendChild(yourSpan);
      }
    }

    wrap.appendChild(periodsRow);
  }

  // Days
  if (days.length > 0) {
    const daysRow = document.createElement("div");
    daysRow.className = "avail-days";
    days.forEach(id => {
      const day = DAYS.find(d => d.id === id);
      if (!day) return;
      const span = document.createElement("span");
      span.className = "tag tag-day";
      span.textContent = day.label;
      daysRow.appendChild(span);
    });
    wrap.appendChild(daysRow);
  }

  return wrap;
}