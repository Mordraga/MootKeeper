// sidePanel.js

import { isLoggedIn, loginWithTwitch, loginWithGoogle, logout, loadUserInfo } from "./auth.js";
import { clear, button, createSidePanel } from "./ui.js";
import { openCategoryManager } from "./categories.js";
import { openTimezoneModal } from "./timezoneModal.js";

function createTwitchLoginButton() {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "auth-brand-btn btn-twitch-brand";
  btn.setAttribute("aria-label", "Sign in with Twitch");

  const img = document.createElement("img");
  img.src = "/assets/twitch_wordmark_flat_white.png";
  img.alt = "Sign in with Twitch";
  img.className = "auth-brand-art twitch-wordmark-img";

  btn.appendChild(img);
  btn.addEventListener("click", loginWithTwitch);
  return btn;
}

function createGoogleLoginButton() {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "auth-brand-btn btn-google";
  btn.setAttribute("aria-label", "Sign in with Google");

  const img = document.createElement("img");
  img.src = "/assets/web_dark_rd_SI@1x.png";
  img.alt = "Sign in with Google";
  img.className = "auth-brand-art google-signin-img";

  btn.appendChild(img);
  btn.addEventListener("click", loginWithGoogle);
  return btn;
}

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

      const subtitle = document.createElement("p");
      subtitle.className = "subtitle";
      const provider = localStorage.getItem("auth_provider");
      const providerLabel = provider === "google" ? "Google" : provider === "twitch" ? "Twitch" : "Unknown";
      subtitle.textContent = `Signed in with ${providerLabel}`;


      const logoutBtn = button("Logout", logout, "btn-sm");

      card.append(img, name, subtitle, logoutBtn);
    }).catch(() => logout());
  } else {
    const prompt = document.createElement("p");
    prompt.className = "auth-prompt";
    prompt.textContent = "Login to sync contacts across devices";

    const loginBtnTwitch = createTwitchLoginButton();
    const loginBtnGoogle = createGoogleLoginButton();

    card.append(prompt, loginBtnTwitch, loginBtnGoogle);
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
