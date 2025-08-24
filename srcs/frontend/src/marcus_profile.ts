import { renderHeader } from "./components/header";
import { profileHandler } from "./handlers/profileHandler";
import { initTwoFAToggle, verify2faHandler } from './handlers/2faHandler'

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
		//add an image class here
		const p_name = document.createElement("p");
		p_name.className = "text-gray-500 dark:text-gray-400";
		p_name.textContent = user.name// Put user's name inside the <p>
		const p_email = document.createElement("p");
		p_email.className = "text-gray-500 dark:text-gray-400";
		p_email.textContent = user.email;

		profilediv.append(p_name, p_email);
		container.appendChild(profilediv);
    } catch (error) {
		console.error("Failed to load profile:", error);
		const errorMsg = document.createElement("p");
		errorMsg.textContent = "Failed to load profile.";
		container.appendChild(errorMsg);
	}
}