import { renderHeader } from './components/header';
// import { marcus_2faEmail, marcus_2faGoogle } from './handlers/marcus_2faHandler';
import { marcus_2faGoogle } from './handlers/marcus_2faHandler';
// import { profileHandler } from "./handlers/profileHandler";
import { verify2faHandler } from './handlers/2faHandler'
// import { createLogger } from "vite";
import type { Match } from "./pong/Tournament/singleElim.ts"
import { API_BASE } from "./variable.ts"


//https://tailwind.build/classes
//https://tailwindcss.com/docs/vertical-align
//https://tailwindcss.com/docs/hover-focus-and-other-states
//https://szasz-attila.medium.com/vue3-radio-button-with-tailwind-css-a-step-by-step-guide-4a9c756b7b2a
export async function marcus_renderProfilePage(container: HTMLElement) {
    renderHeader(container);


	try {
		const userId = localStorage.getItem("id");
		const response = await fetch(`${API_BASE}/api/profile/${userId}`, {
			credentials: "include"
		});
		if (!response.ok) {
			throw new Error(`HTTP error! Status: ${response.status}`);
		}
		const user = await response.json();// Still in try block just in case json parsing to user fails
		console.log("Data From USER:", user);

		//--------------------------Wrapper(profile/stats) Section--------------------------
		const profile_stats_div = document.createElement("div");
		profile_stats_div.className = "flex";
			//(1)--------------------------Profile Section--------------------------
			const profilediv = document.createElement("div");
			profilediv.className = "mx-auto flex max-w-sm items-center gap-x-4 rounded-xl \
									bg-white p-6 shadow-lg outline outline-black/5 \
									dark:bg-slate-800 dark:shadow-none \
									dark:-outline-offset-1 dark:outline-white/10";
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
			link.href = "/profile/update_profile"; //the "/location"
			link.className = "rounded-xl shadow-lg/40 px-2 py-0.5 text-center text-white font-bold \
								bg-sky-500 hover:underline hover:bg-blue-500 focus:outline-2 \
								focus:outline-offset-2 focus:outline-sky-600 active:bg-blue-900";
			link.textContent = "Update Profile"; // For textbox name

			const tooltipDiv = document.createElement("div");//second div
			tooltipDiv.className =
				"tooltip absolute -left-5 mt-1 w-max text-sm text-gray-800 bg-white border \
				border-gray-300 rounded shadow-lg px-2 py-1 opacity-0 group-hover:opacity-100 \
				transition-opacity duration-200 pointer-events-none transition-all duration-1000";
			tooltipDiv.textContent = "Change your details here"; //prints out the string u wanna write

			const update_profile = document.createElement("div");
			update_profile.className = "relative group inline-block";
			update_profile.append(link, tooltipDiv);
			textdiv.append(p_name, p_email, update_profile);
			profilediv.append(p_img, textdiv);
			//(1e)--------------------------Profile Section--------------------------

			//(2)--------------------------game stats Section--------------------------
			const statsHeaderWrapper = document.createElement("div");
			statsHeaderWrapper.id = "statsboxWrapper";
			statsHeaderWrapper.className = "flex mx-auto max-w-sm gap-x-4 rounded-xl \
									bg-black p-6 shadow-lg outline outline-black/5 \
									dark:bg-slate-800 dark:shadow-none \
									dark:-outline-offset-1 dark:outline-white/10";
			const statsdiv = document.createElement("div");
			statsdiv.className = "w-fit";

			//create text as header (Add a box to surrond this as a header ltr)
			const statsheader = document.createElement("h1");
			statsheader.className = "inline-block align-top border bg-sky-500 \
                       					bg-gradient-to-r bg-clip-padding p-2 text-lg font-bold \
                        				text-yellow-300 dark:text-white shadow-lg m-0";
			statsheader.textContent = "Stats";

			//determine which files and which to fetch
			const res = await fetch(`${API_BASE}/api/game/data/${userId}`, {
				method: "GET",
				credentials: "include",
			});
			if (!res.ok) {
			 	throw new Error(`HTTP error! Status: ${res.status}`);
			}
			const matches = await res.json();
			console.log("user:", user.name, " | userId:", userId, " | And their stats:", matches);
			//user_matches--------
				//Print total matches and put on statsboard
				const totalMatches = document.createElement("p");
				totalMatches.className = "text-center text-l font-bold \
											text-yellow-300 dark:text-white";
				totalMatches.textContent = "Total Matches played: " + matches.data.length;
				console.log("[Total_Score]User:", user.name, totalMatches.textContent);

				//print Win/loses and put on statsboard as words for now
				const win_lose_result = document.createElement("p");
				win_lose_result.className = "text-mid font-bold \
											text-yellow-700 dark:text-white text-shadow-lg/15 \
											flex gap-1";
				win_lose_result.textContent = "Win/Lose Ratio: ";
				//print console.log the JSON.string
				console.log("THIS IS FOR JSON:---------->", JSON.stringify(matches));

				//guranteed to be a number..... always but honestly how? -ask maybe xf?
				const wins = matches.data.filter((m: Match) => m.winner && String(m.winner) === String(user.name)).length;
				console.log ("VALUE OF WINS: ", wins);
				const win_ratio = document.createElement("p");
				win_ratio.className = "text-center text-mid font-bold \
											text-green-700 dark:text-white text-shadow-lg/15";
				win_ratio.textContent = `${wins}`;
				console.log("[Score(win)]User:", user.name, win_ratio.textContent);
				const slash_win_lose = document.createElement("p");
				slash_win_lose.className = "text-center text-mid font-bold \
											text-yellow-300 dark:text-white text-shadow-lg/15";
				slash_win_lose.textContent = "/";
				const lose_ratio = document.createElement("p");
				lose_ratio.className = "text-center text-mid font-bold \
										text-red-700 dark:text-white text-shadow-lg/15";
				const losses = matches.data.length - wins;
				lose_ratio.textContent = `${losses}`;
				console.log("[Score(lose)]User:", user.name, lose_ratio.textContent);

				const stats_link = document.createElement("a");
				stats_link.href = "/profile/stats"; //the "/location"
				stats_link.className = "animate-pulse rounded-xl shadow-lg/40 px-2 py-0.5 text-center text-yellow-300 font-bold \
									bg-sky-500 hover:underline hover:bg-blue-500 focus:outline-2 \
									focus:outline-offset-2 focus:outline-sky-600 active:bg-blue-900";
				stats_link.textContent = "Check your stats"; // For textbox name


				//create a second page for more details copy and paste the total matches + win/lose
					//const totalMatches = document.createElement("a");-->/stats
				//the wins and loses improve it by using a circle chart to show the stats
					//https://flowbite.com/docs/plugins/charts/
				//create a second box to contain the latest tournament data of wins/loses
				win_lose_result.append(win_ratio, slash_win_lose, lose_ratio)
			//user_matches--------




			//determine also what they can present and print out here
				//notes
				//instead of “all tournaments created by this user,” you wanted “all tournaments this user participated in (as player1 or player2)”?
			//fetch data from backend and print out the stats

			//append
			statsdiv.append(statsheader, totalMatches, win_lose_result, stats_link);
			statsHeaderWrapper.append(statsdiv);
			profile_stats_div.append(profilediv, statsHeaderWrapper)
			//(2e)--------------------------game stats Section--------------------------
		//--------------------------Wrapper(profile/stats) Section--------------------------




		//--------------------------2fa section--------------------------
		const fa2 = document.createElement("div");
		fa2.className = "p-6 bg-white rounded-xl text-center m-2 w-170 shadow-md \
							dark:bg-slate-800 text-gray-700 dark:text-gray-300";

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
		//const email2faSwitch = marcus_2faEmail("Activate 2FA via Email", "toggle-2fa-email");
		const google2faSwitch = marcus_2faGoogle("Working on getting this to work now", "toggle-2fa");
		const profileWrapper = document.createElement("div");
		profileWrapper.className = "h-screen w-full mx-auto flex flex-col items-center \
									justify-center bg-gray-100 dark:bg-slate-900 space-y-6";
		profileWrapper.append(profile_stats_div, fa2);

		switchContainer.append(google2faSwitch);
		//switchContainer.append(email2faSwitch, google2faSwitch);
		container.appendChild(profileWrapper);
		//(e)--------------------------2fa section--------------------------

		verify2faHandler("verify-2fa-app", "twofa-token-app", "totp");
		verify2faHandler("verify-2fa-email", "twofa-token-email", "email");
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
