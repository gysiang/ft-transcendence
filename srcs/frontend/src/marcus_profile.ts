import { renderHeader } from './components/header';
import { marcus_2faEmail, marcus_2faGoogle } from './handlers/marcus_2faHandler';
// import { profileHandler } from "./handlers/profileHandler";
// import { initTwoFAToggle, verify2faHandler } from './handlers/2faHandler'
// import { createLogger } from "vite";

//https://tailwind.build/classes
//https://tailwindcss.com/docs/hover-focus-and-other-states
//https://szasz-attila.medium.com/vue3-radio-button-with-tailwind-css-a-step-by-step-guide-4a9c756b7b2a
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

		// Profile image
		const p_img = document.createElement("img");
		p_img.src = user.profile_picture;
		p_img.alt = `${user.name}'s profile picture`;
		p_img.className = "w-24 h-24 rounded-full object-cover shadow-lg/40";

		const p_name = document.createElement("p");
		p_name.className = "text-lg font-bold text-gray-900 dark:text-white text-shadow-lg/15";
		p_name.textContent = user.name// Put user's name inside the <p>

		const p_email = document.createElement("p");
		p_email.className = "text-sm text-gray-500 dark:text-gray-400";
		p_email.textContent = user.email;

		const link = document.createElement("a");
        link.href = "/profile"; //the "/location"
        link.className = "rounded-xl shadow-lg/40 px-2 py-0.5 text-center text-white font-bold bg-sky-500 hover:underline hover:bg-blue-500 focus:outline-2 focus:outline-offset-2 focus:outline-sky-600 active:bg-blue-900";
        link.textContent = "Update Profile"; // For textbox name

        const tooltipDiv = document.createElement("div");//second div
        tooltipDiv.className =
            "tooltip absolute -left-5 mt-1 w-max text-sm text-gray-800 bg-white border border-gray-300 rounded shadow-lg px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none transition-all duration-1000";
        tooltipDiv.textContent = "Change your details here"; //prints out the string u wanna write
		
		const update_profile = document.createElement("div");
		update_profile.className = "relative group inline-block";
		update_profile.append(link, tooltipDiv);

		const profileWrapper = document.createElement("div");
		profileWrapper.className = "h-screen w-full mx-auto flex flex-col items-center justify-center bg-gray-100 dark:bg-slate-900 space-y-6";
		textdiv.append(p_name, p_email, update_profile);
		profilediv.append(p_img, textdiv);






		//------2fa section------
		// *2fa **top banner
		const fa2 = document.createElement("div");
		fa2.className = "p-6 bg-white rounded-xl text-center m-2 w-170 shadow-md dark:bg-slate-800 text-gray-700 dark:text-gray-300";

		const fa2span = document.createElement("span");
		fa2span.className = "inline-block px-3 py-1 -skew-y-3 bg-blue-300";
		fa2.appendChild(fa2span);

		const fa2spantext = document.createElement("span");
		fa2spantext.className = "relative text-black dark:text-gray-950";
		fa2spantext.textContent = "Keep your account secure!";
		fa2span.appendChild(fa2spantext);

		const fa2spantext2 = document.createElement("div");
		fa2spantext2.className = "mt-1 text-black dark:text-gray-950";
		fa2spantext2.textContent = "Activate 2FA:";
		fa2.appendChild(fa2spantext2);

		// *2fa -- for switches
		const switchContainer = document.createElement("div");
		switchContainer.className = "flex flex-row gap-4 justify-center mt-4"; 
		// `gap-4` gives spacing, `justify-center` keeps them centered
		fa2.appendChild(switchContainer);

		//marcus_2faEmail("Activate 2FA via Email", "toggle-2fa-email") {}
		const email2faSwitch = marcus_2faEmail("Activate 2FA via Email", "toggle-2fa-email");
		const google2faSwitch = marcus_2faGoogle("Activate 2FA via google Auth", "toggle-2fa-google");
		
		switchContainer.append(email2faSwitch, google2faSwitch);
		profileWrapper.append(profilediv, fa2);
		container.appendChild(profileWrapper);
    } catch (error) {
		console.error("Failed to load profile:", error);
		const errorMsg = document.createElement("p");
		errorMsg.textContent = "Failed to load profile.";
		container.appendChild(errorMsg);
	}
}

//missing:
// Upload button (styled to feel part of avatar)
// Preview selected image