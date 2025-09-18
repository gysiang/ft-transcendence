import { renderApp } from "../router.js";
import { API_BASE } from '../variable.ts'

export async function loginHandler(formId: string) {

	const form = document.getElementById(formId) as HTMLFormElement;
	const errorDiv = document.getElementById("error");
	if (!form) return;

	form.addEventListener("submit", async (e) => {
		e.preventDefault();
		const email = (document.getElementById("email") as HTMLInputElement).value;
		const password = (document.getElementById("password") as HTMLInputElement).value;

		if (localStorage.getItem("id")) {
			console.log("Already logged in, skipping login request");
			renderApp();
			return;
		}

		try {
			const res = await fetch(`${API_BASE}/api/login`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			credentials: "include",
			body: JSON.stringify({ email, password }),
			});
			const data = await res.json();
			console.log("login handler", data);
			if (data.message == 'stage-2fa') {
				const loginForm = document.getElementById("login-form") as HTMLFormElement;
				const email2fa = document.getElementById("email2fa-input") as HTMLElement;
				localStorage.setItem("id", data.id);
				localStorage.setItem("twofa_method", data.twofa_method);
				loginForm.classList.add("hidden");
				email2fa.classList.remove("hidden");
			}
			else if (!res.ok) {
				errorDiv!.textContent = data.message;
			} else {
				localStorage.setItem("id", data.id);
				history.pushState({}, '', "/");
				renderApp();
		}} catch (err: any) {
			errorDiv!.textContent = "Network error. Try again.";
		}
	});
}
