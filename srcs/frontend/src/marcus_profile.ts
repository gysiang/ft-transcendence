import { renderHeader } from "./components/header";
import { profileHandler } from "./handlers/profileHandler";
import { initTwoFAToggle, verify2faHandler } from './handlers/2faHandler'
import { createLogger } from "vite";

//https://tailwind.build/classes
export async function marcus_renderProfilePage(container: HTMLElement) {
    renderHeader(container);


	try {
		const userId = localStorage.getItem("id");
		const response = await fetch(`http://localhost:3000/api/profile/${userId}`, {
			credentials: "include"
		});
		if (!response.ok) {
			throw new Error(`HTTP error! Status: ${response.status}`);
		}
		const user = await response.json();// Still in try block just in case json parsing to user fails
		console.log(user);

		const profilediv = document.createElement("div");
		profilediv.className = "mx-auto flex max-w-sm items-center gap-x-4 rounded-xl bg-white p-6 shadow-lg outline outline-black/5 dark:bg-slate-800 dark:shadow-none dark:-outline-offset-1 dark:outline-white/10";
		const textdiv = document.createElement("div");
		textdiv.className = "flex flex-col";

		const p_img = document.createElement("img");//add an image class here
		p_img.src = user.profile_picture;
		p_img.alt = `${user.name}'s profile picture`;
		p_img.className = "w-24 h-24 rounded-full object-cover shadow-md";

		const p_name = document.createElement("p");
		p_name.className = "text-lg font-bold text-gray-900 dark:text-white";
		p_name.textContent = user.name// Put user's name inside the <p>

		const p_email = document.createElement("p");
		p_email.className = "text-sm text-gray-500 dark:text-gray-400";
		p_email.textContent = user.email;

		const profileWrapper = document.createElement("div");
		profileWrapper.className = "h-screen w-full mx-auto flex flex-col items-center justify-center bg-gray-100 dark:bg-slate-900 space-y-6";




		// 2fa
		// const fa2 = document.createElement("div");
		// fa2.className = "p-6 bg-white rounded-xl shadow-md dark:bg-slate-800 text-gray-700 dark:text-gray-300";
		// fa2.textContent = "2FA coming soon!";

		//2fa -- for buttons
		// const switchWrapper = document.createElement("div");
		// switchWrapper.className = "p-6 bg-white rounded-xl shadow-md dark:bg-slate-800";

		// const switchLabel = document.createElement("label");// label that holds both text + switch
		// switchLabel.className = "flex items-center justify-between w-full cursor-pointer";
		// switchWrapper.appendChild(switchLabel);

		// const switchText = document.createElement("span");// left side text
		// switchText.className = "text-gray-700 dark:text-gray-300";
		// switchText.textContent = "Activate 2FA";
		// switchLabel.appendChild(switchText);





		textdiv.append(p_name, p_email);
		profilediv.append(p_img, textdiv);
		container.appendChild(profilediv);
		// profileWrapper.append(profilediv, fa2);
		// container.appendChild(profileWrapper);
    } catch (error) {
		console.error("Failed to load profile:", error);
		const errorMsg = document.createElement("p");
		errorMsg.textContent = "Failed to load profile.";
		container.appendChild(errorMsg);
	}
}