import {
    saveUserTimeFormatPref,
    userTimeFormatPref,
    saveDisplayNameOverride,
    formatTime
} from './settings.js';

import { 
    loadUserTimezone, 
    saveUserTimezone, 
    COMMON_TIMEZONES, 
    detectTimezone 
} from "./timezone.js";

import { button, separator, createModal, updateModal } from './ui.js';

import { isLoggedIn, loadUserInfo } from "./auth.js";

import { renderAllContacts } from "./contactList.js";

export function openSettingsModal() {
    createModal("Settings", (body) => {
        // Time Format Setting
        const timeFormatLabel = document.createElement("label");
        timeFormatLabel.textContent = "Preferred Time Format:";
        const timeFormatSelect = document.createElement("input");
        timeFormatSelect.type = "checkbox";

        const timeFormatChosen = document.createElement("span");
        const sampleTime = document.createElement("div");

        function updateTimeFormatUI() {
            const pref = userTimeFormatPref();
            timeFormatSelect.checked = (pref === "24");
            updateModal({ timeFormat: pref }, { timeFormatChosen, sampleTime });
        }

        const timeFormatContainer = document.createElement("div");
        timeFormatContainer.className = "setting-item";
        timeFormatContainer.appendChild(timeFormatLabel);
        timeFormatContainer.appendChild(timeFormatSelect);
        timeFormatContainer.appendChild(timeFormatChosen);
        timeFormatContainer.appendChild(sampleTime);

        body.appendChild(timeFormatContainer);
        updateTimeFormatUI();
        timeFormatSelect.addEventListener("change", () => {
            const newPref = timeFormatSelect.checked ? "24" : "12";
            saveUserTimeFormatPref(newPref);
            updateTimeFormatUI();
        });

        body.appendChild(separator());
        
        //Timezone Detection
        const current = loadUserTimezone();
        const detected = detectTimezone();

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
        }, "btn-primary");
        const tzContainer = document.createElement("div");
        tzContainer.className = "setting-item";
        tzContainer.appendChild(tzSelect);
        tzContainer.appendChild(saveBtn);
        body.appendChild(tzContainer);

        body.appendChild(separator());

        // Display Name Override

        if (isLoggedIn()){
            const override = loadDisplayNameOverride();
                if (override) {
                    displayNameInput.value = override;
                } else {
                    loadUserInfo().then(data => {
                        displayNameInput.value = data.display_name || "";
                    });
                }

                const displayNameLabel = document.createElement("label");
                displayNameLabel.textContent = "Change Display Name:";
                const displayNameInput = document.createElement("input");
                displayNameInput.type = "text";
                displayNameInput.placeholder = "Enter a custom display name...";

                const displayNameContainer = document.createElement("div");
                displayNameContainer.className = "setting-item";
                displayNameContainer.appendChild(displayNameLabel);
                displayNameContainer.appendChild(displayNameInput);
                body.appendChild(displayNameContainer);
                updateModal({ displayNameOverride: override }, { displayNameInput });
        }
    });
}