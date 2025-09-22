import { renderHeader } from "./components/header";
import { profileHandler, profilepicHandler } from "./handlers/profileHandler";
import { API_BASE } from "./variable.ts"

export async function renderProfilePage(container: HTMLElement) {
	renderHeader(container);
	try {
		const userId = localStorage.getItem("id");
		const response = await fetch(`${API_BASE}/api/profile/${userId}`, {
			credentials: "include"
		});
		if (!response.ok) {
			throw new Error(`HTTP error! Status: ${response.status}`);
		}
		const user = await response.json();
		const profileWrapper = document.createElement("div");
		profileWrapper.className = "h-screen flex flex-col items-center justify-center bg-gray-100 space-y-6";

		// Profile image
		const img = document.createElement("img");
		img.id = "profile-pic";
		img.src = user.profile_picture;
		img.alt = `${user.name}'s profile picture`;
		img.className = "w-24 h-24 rounded-full object-cover shadow-md";

		// File input (hidden)
		const fileInput = document.createElement("input");
		fileInput.id = "file-input";
		fileInput.type = "file";
		fileInput.accept = "image/*";
		fileInput.style.display = "none";

		// Upload button (styled to feel part of avatar)
		const uploadBtn = document.createElement("button");
		uploadBtn.type = "button";
		uploadBtn.textContent = "Change Photo";
		uploadBtn.className =
			"text-sm text-gray-700 bg-gray-200 px-3 py-1 rounded-full hover:bg-gray-300 transition";
		uploadBtn.addEventListener("click", () => fileInput.click());
		// Profile form
		const profileContainer = document.createElement("div");
		profileContainer.innerHTML = `
			<h1 class="text-2xl font-bold mb-4">Profile</h1>
			<form id="profile-form" class="space-y-3">
				<div class="flex flex-row items-center">
					<p class="pr-4">Name:</p>
					<input
						id="name"
						type="text"
						class="w-40 text-center border-grey-500 border rounded p-1"
						required
					/>
				</div>
				<div class="flex flex-row items-center">
					<p class="pr-4">Email:</p>
					<input
						id="email"
						type="email"
						class="w-40 text-center border-grey-500 border rounded p-1"
						required
					/>
				</div>
				<button type="submit" class="bg-sky-500 text-white p-2 rounded-md w-full">Submit</button>
				<div id="error" class="text-red-500 mt-2"></div>
			</form>
		`;

		// Image & button together
		const avatarSection = document.createElement("div");
		avatarSection.className = "flex flex-col items-center space-y-2";
		avatarSection.appendChild(img);
		avatarSection.appendChild(uploadBtn);

		// Append elements to wrapper
		profileWrapper.appendChild(avatarSection);
		profileWrapper.appendChild(fileInput);
		profileWrapper.appendChild(profileContainer);

		container.appendChild(profileWrapper);

		// Fill in form values
		(document.getElementById("name") as HTMLInputElement).value = user.name;// show the original names in profile first
		(document.getElementById("email") as HTMLInputElement).value = user.email;// show the original email in profile first
		profileHandler("profile-form");
		profilepicHandler("file-input");
		// initTwoFAToggle("toggle-2fa");
		// initTwoFAToggleEmail("toggle-2fa-email");
		// verify2faHandler("verify-2fa-app", "twofa-token-app", "totp");
		// verify2faHandler("verify-2fa-email", "twofa-token-email", "email");
		// initTwoFAMutualExclusion(user.twofa_method);

	} catch (error) {
		console.error("Failed to load profile:", error);
		const errorMsg = document.createElement("p");
		errorMsg.textContent = "Failed to load profile.";
		container.appendChild(errorMsg);
	}
}
