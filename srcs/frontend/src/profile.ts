import { createHeader } from "./components/header";
import { profileHandler } from "./handlers/profileHandler";

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
		//img.width = 100;
		//img.height = 100;
		img.className="flex justify-centre w-20 h-20"

		const fileInput = document.createElement("input");
		fileInput.type = "file";
		fileInput.accept = "image/*";
		fileInput.style.display = "none";

		// Upload button
		const uploadBtn = document.createElement("button");
		uploadBtn.type = "button";
		uploadBtn.textContent = "Change Profile Picture";
		uploadBtn.className = "bg-blue-500 p-2 text-white rounded-md";

		uploadBtn.addEventListener("click", () => {
			fileInput.click();
		});

		// Preview selected image
		fileInput.addEventListener("change", () => {
			const file = fileInput.files?.[0];
			if (file) {
				const reader = new FileReader();
				reader.onload = (e) => {
					img.src = e.target?.result as string; // preview new image
				};
				reader.readAsDataURL(file);
			}
		});

		profileContainer.innerHTML = `
		<div class="h-screen flex items-center justify-center flex-col bg-gray-100">
			<h1 class="text-2xl font-bold">Profile</h1>
			<form id="profile-form" class="space-y-1">
			<div class="flex flex-row">
				<p class="pr-4">Name:</p>
				<input
					id="name"
					type="text"
					class="w-2xs text-center border-grey-500 border-1 border-solid rounded p-1"
					required
				/>
			</div>

			<div class="flex flex-row">
				<p class="pr-4">Email:</p>
				<input
					id="email"
					type="email"
					class="w-2xs text-center border-grey-500 border-1 border-solid rounded p-1"
					required
				/>
			</div>

			<button type="submit" class="w-85 bg-sky-500 text-white p-2 rounded-md">submit</button>
			<div id="error" class="text-red-500 mt-2"></div>
			</form>
		</div>
		`
		container.appendChild(img);
		container.appendChild(fileInput);
		container.appendChild(uploadBtn);
		container.appendChild(profileContainer);
		(document.getElementById("name") as HTMLInputElement).value = user.name;
		(document.getElementById("email") as HTMLInputElement).value = user.email;

		profileHandler(profile-form);

	} catch (error) {
		console.error("Failed to load profile:", error);
		const errorMsg = document.createElement("p");
		errorMsg.textContent = "Failed to load profile.";
		container.appendChild(errorMsg);
	}

}
