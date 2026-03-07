// aboutModal

import { button, createModal } from "./ui.js";

export function openAboutModal() {
    createModal("About MootsKeeper", (body) => {
        const aboutBlurb = document.createElement("p");
        aboutBlurb.textContent = "MootsKeeper is a personal contact manager designed to help you keep "
                                "track of your relationships across various platforms. It allows you to store contact "
                                "information,"
                                "categorize your connections, and sync your data securely.";
        const openSourceBlurb = document.createElement("p");
        openSourceBlurb.textContent = "This project is open-source and available on GitHub. Contributions and feedback are welcome!";
        const githubLink = document.createElement("a");

        githubLink.className = "github-link";
        githubLink.href = "https://github.com/mordraga/mootkeeper";
        githubLink.target = "_blank";
        githubLink.textContent = "Report issues or contribute on GitHub";

        const developerBlurb = document.createElement("p");
        developerBlurb.textContent = "Developed by Mordraga0, software dev and streamer. If you have any questions, suggestions, or just want to say hi, feel free to reach out!";
        const twitterLink = document.createElement("a");
        twitterLink.className = "github-link";
        twitterLink.href = "https://twitter.com/mordraga0";
        twitterLink.target = "_blank";
        twitterLink.textContent = "Report issues or reach out on Twitter";

        const lastUpdated = document.createElement("p");
        lastUpdated.className = "subtitle";
        lastUpdated.textContent = `Last updated: ${document.lastModified}`;

        body.appendChild(aboutBlurb);
        body.appendChild(openSourceBlurb);
        body.appendChild(githubLink);


        body.appendChild(separator);

        body.appendChild(developerBlurb);
        body.appendChild(twitterLink);

        body.appendChild(lastUpdated);
    });
}