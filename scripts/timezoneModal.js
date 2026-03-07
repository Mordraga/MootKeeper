// timezoneModal.js

import { loadUserTimezone, saveUserTimezone, COMMON_TIMEZONES, detectTimezone } from "./timezone.js";
import { button, createModal } from "./ui.js";
import { renderAllContacts } from "./contactList.js";

export function openTimezoneModal() {
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
