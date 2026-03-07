// onboarding.js

import { loadOnboardingDismissedLocal, saveOnboardingDismissedLocal } from "./preferences.js";
import { savePreference } from "./preferences.js";
import { qs } from "./ui.js";

export function initOnboarding() {
    const onboardingCard = qs("onboarding");
    const dismissBtn = qs("dismiss");

    if (!onboardingCard || !dismissBtn) return;

    if (loadOnboardingDismissedLocal()) onboardingCard.classList.add("hidden");

    dismissBtn.addEventListener("click", () => {
        onboardingCard.classList.add("hidden");
        saveOnboardingDismissedLocal(true);
        savePreference("onboardingDismissed", true);
    });
}