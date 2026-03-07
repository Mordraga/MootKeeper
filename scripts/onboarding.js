// onboarding.js

import { loadOnboardingDismissed, saveOnboardingDismissed } from "./preferences.js";
import { qs } from "./ui.js";

export async function initOnboarding() {
  const onboardingCard = qs("onboarding");
  const dismissBtn = qs("dismiss");

  if (!onboardingCard || !dismissBtn) return;

  const alreadyDismissed = await loadOnboardingDismissed();
  if (alreadyDismissed) onboardingCard.classList.add("hidden");

  dismissBtn.addEventListener("click", async () => {
    onboardingCard.classList.add("hidden");
    await saveOnboardingDismissed(true);
  });
}
