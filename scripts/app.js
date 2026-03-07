// app.js

import { handleCallback } from "./auth.js";
import { initSidePanel } from "./sidePanel.js";
import { initFilterBar, renderAllContacts, updateFilterRelationships } from "./contactList.js";
import { initContactForm, rebuildFormDropdowns } from "./contactForm.js";
import { initOnboarding } from "./onboarding.js";
import { loadCategories } from "./categoryStore.js";

async function init() {
  handleCallback();

  initSidePanel(() => {
    rebuildFormDropdowns();
    updateFilterRelationships(loadCategories().relationships);
    renderAllContacts();
  });

  initFilterBar();
  initContactForm(renderAllContacts);
  await initOnboarding();
  renderAllContacts();
}

init();
