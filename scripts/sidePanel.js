// sidePanel.js

import { isLoggedIn, loginWithTwitch, logout, loadUserInfo } from "./auth.js";
import { clear, button, createSidePanel } from "./ui.js";
import { openCategoryManager } from "./categories.js";
import { openTimezoneModal } from "./timezoneModal.js";

function buildAuthCard() {
  const card = document.createElement("div");
  card.className = "auth-card";

  if (isLoggedIn()) {
    const loading = document.createElement("p");
    loading.className = "auth-name";
    loading.textContent = "Loading...";
    card.appendChild(loading);

    loadUserInfo().then(data => {
      clear(card);

      const img = document.createElement("img");
      img.src = data.profile_image_url;
      img.alt = data.display_name;
      img.className = "auth-pfp";

      const name = document.createElement("p");
      name.className = "auth-name";
      name.textContent = `@${data.display_name}`;

      const logoutBtn = button("Logout", logout, "btn-sm");

      card.append(img, name, logoutBtn);
    }).catch(() => logout());
  } else {
    const prompt = document.createElement("p");
    prompt.className = "auth-prompt";
    prompt.textContent = "Login to sync contacts across devices";

    const loginBtnGoogle = button("Login with Google", loginWithGoogle, "btn-secondary");
    const loginBtnTwitch = button("Login with Twitch", loginWithTwitch, "btn-primary");
    loginBtn.style.width = "100%";

    card.append(prompt, loginBtn);
  }

  return card;
}

export function initSidePanel(onCategoryUpdate) {
  const { panel, inner } = createSidePanel([
    {
      label: "Categories",
      icon: "🗂",
      onClick: () => openCategoryManager(onCategoryUpdate)
    },
    {
      label: "My Timezone",
      icon: "🕐",
      onClick: () => openTimezoneModal()
    }
  ]);

  inner.appendChild(buildAuthCard());
  document.body.insertBefore(panel, document.body.firstChild);
}
