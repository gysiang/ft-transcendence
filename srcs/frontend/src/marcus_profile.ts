import { renderHeader } from "./components/header";
import { profileHandler } from "./handlers/profileHandler";
import { initTwoFAToggle, verify2faHandler } from './handlers/2faHandler'

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
		profileWrapper.className = "h-screen w-full mx-auto flex items-center justify-center bg-gray-100 dark:bg-slate-900 space-y-6";
		
		textdiv.append(p_name, p_email);
		profilediv.append(p_img, textdiv);
		profileWrapper.append(profilediv);
		container.appendChild(profileWrapper);
    } catch (error) {
		console.error("Failed to load profile:", error);
		const errorMsg = document.createElement("p");
		errorMsg.textContent = "Failed to load profile.";
		container.appendChild(errorMsg);
	}
}