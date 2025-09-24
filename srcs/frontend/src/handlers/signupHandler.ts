import { renderApp } from "../router.js";
import { API_BASE } from "../variable.js"

export async function signupHandler(formId: string) {
	const form = document.getElementById(formId) as HTMLFormElement;
	const errorDiv = document.getElementById("error");
	if (!form) return;

	form.addEventListener("submit", async (e) => {
		e.preventDefault();

		const name = (document.getElementById("name") as HTMLInputElement).value;
		const email = (document.getElementById("email") as HTMLInputElement).value;
		const password = (document.getElementById("password") as HTMLInputElement).value;

		try {
			const res = await fetch(`${API_BASE}/api/signup`,
			{
				method: "POST",
				headers: { "Content-Type": "application/json" },
				credentials: "include",
				body: JSON.stringify({ name, email, password }),
			});
		const data = await res.json();
		if (!res.ok) {
			errorDiv!.textContent = data.message;
		} else {
			localStorage.setItem("id", data.id);
			history.pushState({}, '', "/");
			renderApp();
		}} catch (err : any) {
			errorDiv!.textContent = "Network error. Try again.";
		}
	});
}

export async function googleHandler(buttonId: string) {
	const googleButton = document.getElementById(buttonId);
	if (!googleButton) return;

	googleButton.addEventListener('click', () => {
		const isLocal = window.location.hostname.includes("localhost");
		const authPath = isLocal ? "/auth/re-google" : "/auth/google";
		const redirectUrl = `${API_BASE}${authPath}`;
		window.location.href = redirectUrl;
	});

	window.addEventListener("DOMContentLoaded", () => {
	const params = new URLSearchParams(window.location.search);
	const userId = params.get("userId");

	if (userId) {
		console.log("Logged in user:", userId);
		localStorage.setItem("userId", userId);
		window.history.replaceState({}, document.title, "/");
	}
	});
}
