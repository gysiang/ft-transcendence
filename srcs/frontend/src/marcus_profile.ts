import { renderHeader } from "./components/header";
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

		const p_img = document.createElement("img");//add an image class here
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

		const email2faSwitch = create_2faSwitch("Activate 2FA via Email", (checked) => {
			if (checked) {
				console.log("Email 2FA ON");
				protect2faNotify("✅ Email 2FA Activated!");
			} else {
				console.log("Email 2FA OFF");
				protect2faNotify("❌ Email 2FA Disabled!");
			}
		});

		const app2faSwitch = create_2faSwitch("Activate 2FA via Google Auth ", (checked) => {
			if (checked) {
				console.log("App 2FA ON");
				protect2faNotify("✅ App 2FA Activated!");
			} else {
				console.log("App 2FA OFF");
				protect2faNotify("❌ App 2FA Disabled!");
			}
		});

		switchContainer.append(email2faSwitch, app2faSwitch);
		profileWrapper.append(profilediv, fa2);
		container.appendChild(profileWrapper);
    } catch (error) {
		console.error("Failed to load profile:", error);
		const errorMsg = document.createElement("p");
		errorMsg.textContent = "Failed to load profile.";
		container.appendChild(errorMsg);
	}
}

export function protect2faNotify(Msg: string, duration = 3000) {
	const smallbox = document.createElement("div");
	smallbox.className = "fixed bottom-4 left-1/2 transform -translate-x-1/2 \
		bg-gray-800 text-white px-4 py-2 rounded shadow-lg \
        opacity-0 transition-all duration-500";
	smallbox.textContent = Msg;
	document.body.append(smallbox);

	// Animate in
    setTimeout(() => {
        smallbox.classList.add("opacity-100");
    }, 50);

    // Animate out and remove after duration
    setTimeout(() => {
        smallbox.classList.remove("opacity-100");
        setTimeout(() => smallbox.remove(), 500);
    }, duration);
}

export function create_2faSwitch(labeltext: string, onToggle: (checked: boolean) => void) {
	// *2fa -- for buttons
	const switchWrapper = document.createElement("div");
	switchWrapper.className = "p-6 bg-white rounded-xl shadow-md dark:bg-slate-800";

	const switchLabel = document.createElement("label");// label that holds both text + switch
	switchLabel.className = "flex inline-flex items-center justify-between w-full cursor-pointer gap-x-4";
	switchWrapper.appendChild(switchLabel);

	const switchText = document.createElement("span");// left side text
	switchText.className = "text-center text-gray-700 dark:text-gray-300";//***Why is this not centered
	switchText.textContent = labeltext;
	switchLabel.appendChild(switchText);

	// add the hidden checkbox for tailwind
	const hiddenSwitchInput = document.createElement("input");
	hiddenSwitchInput.type = "checkbox";
	hiddenSwitchInput.className = "sr-only peer";//hide checkbox visually until clicked
	switchLabel.appendChild(hiddenSwitchInput);

	const track = document.createElement("div");
	//peer-checked:bg-green-500 → turns track green when checked.
	track.className = "relative w-13 h-8 bg-gray-200 peer-focus:outline-none border-4 border-gray-500 \
						peer-checked:border-green-800 peer-focus:ring-4 peer-focus:ring-blue-300 \
						dark:peer-focus:ring-green-800 rounded-full peer dark:bg-gray-700 \
						peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full \
						peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] \
						after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full \
						after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-green-600 \
						dark:peer-checked:bg-green-600";
	switchLabel.appendChild(track);

	const thumb = document.createElement("span");
	thumb.className = "ms-3 text-sm font-medium text-gray-900 dark:text-gray-300";//peer-checked:translate-x-5 → moves the thumb right when checked.
	track.appendChild(thumb);

	// ✅ Hook up toggle event
	hiddenSwitchInput.addEventListener("change", () => {
		onToggle(hiddenSwitchInput.checked);
	});

	return switchWrapper;
}
