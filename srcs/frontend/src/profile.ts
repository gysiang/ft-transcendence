import { createHeader } from "./components/header";

export async function renderProfilePage(container: HTMLElement) {

	container.innerHTML = "";

	const header = createHeader();
	container.appendChild(header);

	try {
		const userId = localStorage.getItem("id");
		const response = await fetch(`http://localhost:3000/api/profile/${userId}`, {
			credentials: "include"
		});
		if (!response.ok) {
			throw new Error(`HTTP error! Status: ${response.status}`);
		}

		const user = await response.json();

		const profileContainer = document.createElement("div");
		profileContainer.className = "profile";

		const img = document.createElement("img");
		img.src = user.profile_picture;
		img.alt = `${user.name}'s profile picture`;
		img.width = 150;
		img.height = 150;

		const nameEl = document.createElement("h2");
		nameEl.textContent = user.name;

		const emailEl = document.createElement("p");
		emailEl.textContent = user.email;

		profileContainer.appendChild(img);
		profileContainer.appendChild(nameEl);
		profileContainer.appendChild(emailEl);

		container.appendChild(profileContainer);
	} catch (error) {
		console.error("Failed to load profile:", error);
		const errorMsg = document.createElement("p");
		errorMsg.textContent = "Failed to load profile.";
		container.appendChild(errorMsg);
	}

}
