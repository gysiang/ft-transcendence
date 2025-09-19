import QRCode from "qrcode";
import { verify2faHandler } from '../handlers/2faHandler'
import { API_BASE } from '../variable.ts'


export async function all_2faswitches(method: string, checkboxid1: string): Promise<HTMLDivElement> {
	//gap inside the containers all stuff will gap by 4
	const overall_wrapper = document.createElement("div");
	overall_wrapper.className = "flex flex-col items-center gap-4";

	const button_wrapper = document.createElement("div");
	button_wrapper.className = "flex flex-row items-center gap-4";

	const wrapper = document.createElement("div");
	wrapper.className = "flex flex-row items-center gap-4";

    // Section where QR code / email input will appear
    const qrSection: HTMLDivElement = document.createElement("div");
	qrSection.id = "twofa-section";
	qrSection.className = "mt-4 hidden flex flex-col items-center space-y-4";

    // ---- Create buttons for Google and Email 2FA ----
    const googleBtn = document.createElement("button");
    googleBtn.className = "bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600";
    googleBtn.textContent = "Enable Google 2FA";

    const emailBtn = document.createElement("button");
    emailBtn.className = "bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600";
    emailBtn.textContent = "Enable Email 2FA";

    // Disable both after activation to prevent double enabling
    function disableBoth() {
        googleBtn.disabled = true;
        emailBtn.disabled = true;
        googleBtn.classList.add("opacity-50", "cursor-not-allowed");
        emailBtn.classList.add("opacity-50", "cursor-not-allowed");
    }

	function showBoth() {
		googleBtn.disabled = false;
        emailBtn.disabled = false;
        googleBtn.classList.remove("opacity-50", "cursor-not-allowed");
        emailBtn.classList.remove("opacity-50", "cursor-not-allowed");
	}

	
	try {
		//twofa_enabledChecker
		const twofa_switch = create_2faSwitch(method, checkboxid1) as HTMLDivElement;
		if (!twofa_switch)
			console.error("create_2faSwitch returned null or undefined!");
		button_wrapper.append(twofa_switch);
		const hiddenSwitchInput= twofa_switch.querySelector(`#${checkboxid1}`) as HTMLInputElement | null;
		if (!hiddenSwitchInput)
			console.error("Hidden Switch Not found!");

		button_wrapper.addEventListener("click", async () => {
			if (hiddenSwitchInput && hiddenSwitchInput.checked == true) {
				const confirmDisable = confirm("Are you sure you want to disable 2FA?");
				if (confirmDisable) {
					console.log("✅ User clicked OK");
					showBoth();
					if (hiddenSwitchInput)
						hiddenSwitchInput.checked = false;
					protect2faNotify("❌ 2FA has been disabled!");
					const id = localStorage.getItem("id");
					await fetch(`${API_BASE}/2fa/disable`, {
							method: "POST",
							headers: { "Content-Type": "application/json" },
							credentials: "include",
							body: JSON.stringify({ id }),
					});
				} else {
					// ❌ User clicked Cancel
					console.log("User canceled disabling 2FA.");
				}
			}
		})
	

		// Google button click handler
		googleBtn.addEventListener("click", async () => {
			qrSection.classList.remove("hidden");
			qrSection.innerHTML = ""; // clear previous content
			const qrBox: HTMLDivElement = document.createElement("div");
			qrBox.id = "qrcode";
			qrSection.appendChild(qrBox);

			// Create input + verify button
			const twofaInput = document.createElement("input");
			twofaInput.type = "text";
			twofaInput.id = "twofa-token-app";
			twofaInput.placeholder = "Enter 6-digit code";
			twofaInput.className = "border p-2 rounded w-40 text-center";

			const verifyBtn = document.createElement("button");
			verifyBtn.id = "verify-2fa-app";
			verifyBtn.className = "bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600";
			verifyBtn.textContent = "Verify";

			qrSection.append(twofaInput, verifyBtn);

			// Request QR code from backend
			const id = localStorage.getItem("id");
			const res = await fetch(`${API_BASE}/2fa/setup`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				credentials: "include",
				body: JSON.stringify({ id }),
			});
			if (!res.ok) {
				console.error("❌ RES failed here", res.status);
				throw alert("RES failed (googleBtn).");
			}
			const data = await res.json();
			if (data && data.otpauth_url) {
				console.log("VALUE OF THE data MARCUS HERE!:", data)
				const canvas = document.createElement("canvas");
				qrBox.appendChild(canvas);
				QRCode.toCanvas(canvas, data.otpauth_url, { width: 200 }, (err: any) => {
					if (err)
						console.error(err);
					else
						console.log("QR code generated!");
				});
			}

			verifyBtn.addEventListener("click", async () => {
				const token = twofaInput.value.trim();
				if (!token) return alert("Enter the 6-digit code first!");
				const verifyRes = await fetch(`${API_BASE}/2fa/verify`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					credentials: "include",
					body: JSON.stringify({ id, token, twofa_method: "totp" }),
				});
				if (verifyRes.ok) {
					alert("✅ Google 2FA Activated!");
					console.log("Google 2FA ON");
					if (hiddenSwitchInput)
						hiddenSwitchInput.checked = true;
					protect2faNotify("✅ Google 2FA Activated!");
					disableBoth();
					qrSection.classList.add("hidden");
					console.log("VALUE OF THE verifyRES MARCUS HERE!:", verifyRes);
				} else {
					alert("❌ Invalid code. Please try again.");
				}
			});
		});

		// Email button click handler (same idea)
		emailBtn.addEventListener("click", async () => {
			qrSection.classList.remove("hidden");
			qrSection.innerHTML = "";
			const input = document.createElement("input");
			input.type = "text";
			input.placeholder = "Enter 6-digit code";
			input.className = "border p-2 rounded w-40 text-center";

			const verifyBtn = document.createElement("button");
			verifyBtn.className = "bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600";
			verifyBtn.textContent = "Verify";

			qrSection.append(input, verifyBtn);

			//Generate a code and send it back to the user's email
			const id = localStorage.getItem("id");
			await fetch(`${API_BASE}/2fa/setup/email`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				credentials: "include",
				body: JSON.stringify({ id }),
			});
			protect2faNotify("📧 2FA code sent, please check your Email");

			verifyBtn.addEventListener("click", async () => {
				const token = input.value.trim();
				if (!token)
					return alert("Enter the 6-digit code first!");
				const verifyRes = await fetch(`${API_BASE}/2fa/verify`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					credentials: "include",
					body: JSON.stringify({ id, token, twofa_method: "email" }),
				});
				if (verifyRes.ok) {
					alert("✅ Email 2FA Activated!");
					console.log("Email 2FA ON");
					if (hiddenSwitchInput)
						hiddenSwitchInput.checked = true;
					protect2faNotify("✅ Email 2FA Activated!");
					disableBoth();
					qrSection.classList.add("hidden");
					console.log("VALUE OF THE verifyRES MARCUS HERE!:", verifyRes)
				} else {
					alert("❌ Invalid code. Please try again.");
				}
			});
    	});
		const statusRes = await fetch(`${API_BASE}/2fa/status`, {
			method: "GET",
			credentials: "include"
		});
		if (!statusRes.ok) {
			console.error("❌ RES failed here", statusRes.status);
			throw alert("RES failed (emailBtn).");
		}
		const status = await statusRes.json();
		if (status.twofa_enabled) {
			disableBoth(); // disables and greys out the buttons
			if (hiddenSwitchInput)
				hiddenSwitchInput.checked = true;
		} else {
			showBoth();
			if (hiddenSwitchInput)
				hiddenSwitchInput.checked = false;
		}
	} catch (err: any) {
		console.error("Failed to verify Google 2FA:", err);
		alert("Something went wrong. Look at marcus_2faHandler.");
	}

    // Append buttons + QR section to wrapper
	wrapper.append(googleBtn, emailBtn);
    overall_wrapper.append(button_wrapper, wrapper, qrSection);
	// ✅ Attach event listener here (after DOM elements exist)
	verify2faHandler("verify-2fa-app", "twofa-token-app", "totp");
	verify2faHandler("verify-2fa-email", "twofa-token-email", "email");
    return overall_wrapper;
}

// the => void is meant to tell TS that its just a callback function.
// callback -> a function that you pass as an argument to another function, so it can be “called back” later.
//export function create_2faSwitch(labeltext: string, id: string, onToggle: (checked: boolean, id: string) => void) {
export function create_2faSwitch(labeltext: string, checkboxid: string) {
	// *2fa -- for buttons
	const switchWrapper = document.createElement("div");
	switchWrapper.className = "p-6 bg-white rounded-xl shadow-md dark:bg-slate-800";

	const switchLabel = document.createElement("label");// label that holds both text + switch
	switchLabel.className = "flex flex-row inline-flex items-center justify-center w-full cursor-pointer gap-x-4";
	switchWrapper.appendChild(switchLabel);

	const switchText = document.createElement("span");// left side text
	switchText.className = "text-center text-gray-700 dark:text-gray-300";//***Why is this not centered
	switchText.textContent = labeltext;
	switchLabel.appendChild(switchText);

	// add the hidden checkbox for tailwind
	const hiddenSwitchInput = document.createElement("input");
	hiddenSwitchInput.type = "checkbox";
	hiddenSwitchInput.disabled = true;//edit this ltr
	//document.getElementById(checkboxid).disabled = false;
	hiddenSwitchInput.className = "sr-only peer";//hide checkbox visually until clicked
	hiddenSwitchInput.id = checkboxid;
	switchLabel.appendChild(hiddenSwitchInput);

	//-------------button-------------
	const track = document.createElement("div");
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
	return switchWrapper;
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
