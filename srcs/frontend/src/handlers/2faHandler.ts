import QRCode from "qrcode";
import { API_BASE } from '../variable.ts'

export function initTwoFAToggle(checkboxId: string) {
	const toggle = document.getElementById(checkboxId) as HTMLInputElement;
	if (!toggle) {
		console.warn("2FA toggle element not found");
		return;
	}

	const qrSection = document.getElementById("twofa-section");
	const id = localStorage.getItem("id");

	toggle.addEventListener("change", async (event) => {
	if ((event.target as HTMLInputElement).checked) {
		qrSection?.classList.remove("hidden");

	const res = await fetch(`${API_BASE}/2fa/setup`, {
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
			if (err) console.error(err);
			else console.log("QR code generated!");
		});
	}

	} else {
		qrSection?.classList.add("hidden");

	await fetch(`${API_BASE}/2fa/disable`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		credentials: "include",
		body: JSON.stringify({ id }),
		});
		}
	});
}

export function initTwoFAToggleEmail(checkboxId: string) {
	const toggle = document.getElementById(checkboxId) as HTMLInputElement;
	if (!toggle) {
		console.warn("2FA Email toggle element not found");
	return;
	}
	const email2FAContainer= document.getElementById("email2fa-input");
	const id = localStorage.getItem("id");

	toggle.addEventListener("change", async (event) => {
	if ((event.target as HTMLInputElement).checked) {
	email2FAContainer?.classList.remove("hidden");

	await fetch(`${API_BASE}/2fa/setup/email`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		credentials: "include",
		body: JSON.stringify({ id }),
	});
} else {
		email2FAContainer?.classList.add("hidden");
		await fetch(`${API_BASE}/2fa/disable`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			credentials: "include",
			body: JSON.stringify({ id }),
		});
	}})
}

export function verify2faHandler(buttonId: string, inputId: string) {
  const button = document.getElementById(buttonId) as HTMLButtonElement;
  const input = document.getElementById(inputId) as HTMLInputElement;
  const qrSection = document.getElementById("twofa-section") as HTMLElement;
  const email2faSection = document.getElementById("email2fa-input") as HTMLElement;
  if (!button || !input) {
    console.warn("Verify button or input not found");
    return;
  }

  button.addEventListener("click", async () => {
	const token = input.value.trim();
	const userId = localStorage.getItem("id");

	if (!token || !userId) {
		alert("Please enter the 6-digit code.");
		return;
	}

	try {
		const res = await fetch(`${API_BASE}/2fa/verify`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			credentials: "include",
			body: JSON.stringify({
			id: userId,
			token: token
		}),
	});

	const data = await res.json();

	if (res.ok) {
		alert("2FA verified successfully!");
		input.value = "";
		email2faSection?.classList.add("hidden");
		qrSection?.classList.add("hidden");
	} else {
		alert(`Verification failed: ${data.message}`);
		input.value = "";
	}
	} catch (err: any) {
		console.error("Failed to verify 2FA:", err);
		alert("An error occurred. Please try again.");
	}
	});
}

export function verify2faLoginHandler(buttonId: string, inputId: string) {
	const button = document.getElementById(buttonId) as HTMLButtonElement;
	const input = document.getElementById(inputId) as HTMLInputElement;

	if (!button || !input) {
		console.warn("Verify button or input not found");
		return;
	}

	button.addEventListener("click", async () => {
	const token = input.value.trim();
	const userId = localStorage.getItem("id");

	if (!token || !userId) {
		alert("Please enter the 6-digit code.");
		return;
	}

	try {
		const res = await fetch(`${API_BASE}/2fa/verify`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			credentials: "include",
			body: JSON.stringify({
			id: userId,
			token: token
		}),
	});

	const data = await res.json();
	if (res.ok) {
		window.location.href = "/";
	} else {
		alert(`2FA Verification failed: ${data.message}`);
		input.value = "";
	}
	} catch (err: any) {
		console.error("Failed to verify 2FA:", err);
		alert("An error occurred. Please try again.");
	}
	});
}

export function initTwoFAMutualExclusion(twofa_method: string) {
	const googleToggle = document.getElementById("toggle-2fa") as HTMLInputElement;
	const emailToggle = document.getElementById("toggle-2fa-email") as HTMLInputElement;

	if (!googleToggle || !emailToggle) return;

	googleToggle.addEventListener("change", () => {
		if (googleToggle.checked) {
			emailToggle.disabled = true;
		} else {
			emailToggle.disabled = false;
		}
	});

	emailToggle.addEventListener("change", () => {
		if (emailToggle.checked) {
			googleToggle.disabled = true;
		} else {
			googleToggle.disabled = false;
		}
	});

	if (twofa_method === "totp") {
		googleToggle.checked = true;
		emailToggle.disabled = true;
	} else if (twofa_method === "email") {
		emailToggle.checked = true;
		googleToggle.disabled = true;
	} else {
		googleToggle.checked = false;
		emailToggle.checked = false;
		googleToggle.disabled = false;
		emailToggle.disabled = false;
	}
}
