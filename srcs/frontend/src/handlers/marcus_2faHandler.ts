
import QRCode from "qrcode";


//async is used only for event, so here no need
export function marcus_2faEmail(method: string, checkboxid: string) {
	// Create the container div
	const inputBox: HTMLDivElement = document.createElement("div");
	inputBox.id = "email2fa-input";
	inputBox.className = "mt-4 hidden flex flex-col items-center space-y-4";

	// Create the input element
	const emailInput: HTMLInputElement = document.createElement("input");
	emailInput.type = "text";
	emailInput.id = "twofa-token-email";
	emailInput.placeholder = "Enter 6-digit code";
	emailInput.className = "border p-2 rounded w-40 text-center";

	// Create the verify button
	const verifyBtn: HTMLButtonElement = document.createElement("button");
	verifyBtn.id = "verify-2fa-email";
	verifyBtn.className = "bg-blue-500 text-white px-4 py-2 rounded";
	verifyBtn.textContent = "Verify";

	// Append input and button to the container
	inputBox.append(emailInput, verifyBtn);


	const email2faSwitch = create_2faSwitch(method, checkboxid, async (checked) => {
		const id = localStorage.getItem("id");

		if (checked) {
			inputBox.classList.remove("hidden");

			await fetch("http://localhost:3000/2fa/setup/email", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				credentials: "include",
				body: JSON.stringify({ id }),
			});
			console.log("Email 2FA ON");
			protect2faNotify("✅ Email 2FA Activated!");
		} else {
			inputBox.classList.add("hidden");

			await fetch("http://localhost:3000/2fa/disable", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				credentials: "include",
				body: JSON.stringify({ id }),
			});
			console.log("Email 2FA OFF");
			protect2faNotify("❌ Email 2FA Disabled!");
		}
	});
	email2faSwitch.appendChild(inputBox);
	return email2faSwitch;
};


//double check whats the checkboxid for again?
export function marcus_2faGoogle(method: string, checkboxid: string) {
	const qrSection: HTMLDivElement = document.createElement("div");
	qrSection.id = "twofa-section";
	qrSection.className = "mt-4 hidden flex flex-col items-center space-y-4";

	// Create the QR container
	const qrContainer: HTMLDivElement = document.createElement("div");
	qrContainer.id = "qrcode";

	// Create the input
	const twofaInput: HTMLInputElement = document.createElement("input");
	twofaInput.type = "text";
	twofaInput.id = "twofa-token-app";
	twofaInput.placeholder = "Enter 6-digit code";
	twofaInput.className = "border p-2 rounded w-40 text-center";

	// Create the button
	const verifyBtn: HTMLButtonElement = document.createElement("button");
	verifyBtn.id = "verify-2fa-app";
	verifyBtn.className = "bg-blue-500 text-white px-4 py-2 rounded";
	verifyBtn.textContent = "Verify";

	// Append children to the section
	qrSection.append(qrContainer, twofaInput, verifyBtn);


	const google2faSwitch = create_2faSwitch(method, checkboxid, async (checked) => {
		const id = localStorage.getItem("id");

		if (checked) {
			qrSection.classList.remove("hidden");

			const res = await fetch("http://localhost:3000/2fa/2fa/setup", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				credentials: "include",
				body: JSON.stringify({ id }),
			});

			const data = await res.json();
			const qrContainer = document.getElementById("qrcode");
			if (qrContainer) {
				qrContainer.innerHTML = "";
				const canvas = document.createElement("canvas");
				qrContainer.appendChild(canvas);
		
				QRCode.toCanvas(canvas, data.otpauth_url, { width: 200 }, (err) => {
					if (err) 
						console.error(err);
					else 
						console.log("QR code generated!");
				});
			}
			console.log("Google 2FA ON");
			protect2faNotify("✅ Google 2FA Activated!");
		} else {
			qrSection.classList.add("hidden");

			await fetch("http://localhost:3000/2fa/disable", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				credentials: "include",
				body: JSON.stringify({ id }),
			});
			console.log("Google 2FA OFF");
			protect2faNotify("❌ Google 2FA Disabled!");
		}
	});
	google2faSwitch.appendChild(qrSection);
	return google2faSwitch;
};

// the => void is meant to tell TS that its just a callback function.
// callback -> a function that you pass as an argument to another function, so it can be “called back” later.
//export function create_2faSwitch(labeltext: string, id: string, onToggle: (checked: boolean, id: string) => void) {
export function create_2faSwitch(labeltext: string, id: string, onToggle: (checked: boolean) => void) {
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
	hiddenSwitchInput.id = id;
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


