import { renderHeader } from "./components/header";
import { profileHandler } from "./handlers/profileHandler";
import { initTwoFAToggle, initTwoFAToggleEmail, verify2faHandler, initTwoFAMutualExclusion } from './handlers/2faHandler'

//for colour change for buttons
//https://tailwindcss.com/docs/hover-focus-and-other-states
export async function renderProfilePage(container: HTMLElement) {
	renderHeader(container);

	try {
		const userId = localStorage.getItem("id");
		const response = await fetch(`http://localhost:3000/api/profile/${userId}`, {
			credentials: "include"
		});
		if (!response.ok) {
			throw new Error(`HTTP error! Status: ${response.status}`);
		}

		const user = await response.json();
		console.log(user);
		// Main wrapper for centering everything
		const toggleWrapper = document.createElement("div");
		toggleWrapper.innerHTML=`
			<label class="relative flex justify-between items-center p-2 text-xl">
			Activate 2FA via Google Auth
			<input id="toggle-2fa" type="checkbox" class="absolute left-1/2 -translate-x-1/2 w-full h-full peer appearance-none rounded-md" />
			<span class="w-16 h-10 flex items-center flex-shrink-0 ml-4 p-1 bg-gray-300 rounded-full duration-300 ease-in-out peer-checked:bg-green-400 after:w-8 after:h-8 after:bg-white after:rounded-full after:shadow-md after:duration-300 peer-checked:after:translate-x-6"></span>
			</label>
		`
		const qrSection = document.createElement("div");
		qrSection.id = "twofa-section";
		qrSection.className = "mt-4 hidden flex flex-col items-center space-y-4";
		qrSection.innerHTML = `
		<div id="qrcode"></div>
		<input
			type="text"
			id="twofa-token-app"
			placeholder="Enter 6-digit code"
			class="border p-2 rounded w-40 text-center"
		/>
		<button
			id="verify-2fa-app"
			class="bg-blue-500 text-white px-4 py-2 rounded"
		>
			Verify
		</button>
		`;
		toggleWrapper.appendChild(qrSection);

		const profileWrapper = document.createElement("div");
		profileWrapper.className = "h-screen flex flex-col items-center justify-center bg-gray-100 space-y-6";
		profileWrapper.appendChild(toggleWrapper);

		const emailToggleWrapper = document.createElement("div");
		emailToggleWrapper.innerHTML=`
			<label class="relative flex justify-between items-center p-2 text-xl">
			Activate 2FA via Email
			<input id="toggle-2fa-email" type="checkbox" class="absolute left-1/2 -translate-x-1/2 w-full h-full peer appearance-none rounded-md" />
			<span class="w-16 h-10 flex items-center flex-shrink-0 ml-4 p-1 bg-gray-300 rounded-full duration-300 ease-in-out peer-checked:bg-green-400 after:w-8 after:h-8 after:bg-white after:rounded-full after:shadow-md after:duration-300 peer-checked:after:translate-x-6"></span>
			</label>
		`

		const inputBox = document.createElement("div");
		inputBox.id = "email2fa-input";
		inputBox.className = "mt-4 hidden flex flex-col items-center space-y-4";
		inputBox.innerHTML = `
		<input
			type="text"
			id="twofa-token-email"
			placeholder="Enter 6-digit code"
			class="border p-2 rounded w-40 text-center"
		/>
		<button
			id="verify-2fa-email"
			class="bg-blue-500 text-white px-4 py-2 rounded"
		>
			Verify
		</button>
		`
		emailToggleWrapper.appendChild(inputBox);
		profileWrapper.appendChild(emailToggleWrapper);

		// Profile image
		const img = document.createElement("img");
		img.src = user.profile_picture;
		img.alt = `${user.name}'s profile picture`;
		img.className = "w-24 h-24 rounded-full object-cover shadow-md";

		// File input (hidden)
		const fileInput = document.createElement("input");
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

		// Preview selected image
		fileInput.addEventListener("change", async() => {
			const file = fileInput.files?.[0];
			if (file) {

				const maxSize = 40 * 1024;
				if (file.size > maxSize) {
					alert("File size exceeds 40 KB limit.");
					fileInput.value = "";
					return;
				}
				const reader = new FileReader();
				reader.onload = (e) => {
					img.src = e.target?.result as string;
				};
				reader.readAsDataURL(file);

				const formData = new FormData();
				formData.append("profile_picture", file);

				try {
				const res = await fetch(`http://localhost:3000/api/profile/${userId}/pic`, {
					method: "PATCH",
					body: formData,
					credentials: "include",
				});

				if (!res.ok) throw new Error("Upload failed");
				const data = await res.json();
				//console.log(data);
				img.src = data.image;
				} catch (err) {
				console.error("Error uploading image:", err);
				}
			}
		});

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
		initTwoFAToggle("toggle-2fa");
		initTwoFAToggleEmail("toggle-2fa-email");
		verify2faHandler("verify-2fa-app", "twofa-token-app");
		verify2faHandler("verify-2fa-email", "twofa-token-email");
		initTwoFAMutualExclusion(user.twofa_method);

	} catch (error) {
		console.error("Failed to load profile:", error);
		const errorMsg = document.createElement("p");
		errorMsg.textContent = "Failed to load profile.";
		container.appendChild(errorMsg);
	}
}
