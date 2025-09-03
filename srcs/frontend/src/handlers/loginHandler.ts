import { renderApp } from "../router.js";

export async function loginHandler(formId: string) {

	const form = document.getElementById(formId) as HTMLFormElement;
	const errorDiv = document.getElementById("error");
	if (!form) return; // if no form, stop here

	form.addEventListener("submit", async (e) => {
		e.preventDefault(); //prevent reload
		const email = (document.getElementById("email") as HTMLInputElement).value;
		const password = (document.getElementById("password") as HTMLInputElement).value;
		//const loginForm = document.getElementById("login-form") as HTMLFormElement;
		//const email2fa = document.getElementById("email2fa-input") as HTMLElement;

		if (localStorage.getItem("id")) {
			console.log("Already logged in, skipping login request");
			renderApp(); // just re-render homepage or dashboard
			return;
		}

		//JSON is used as a language to send to backend
		try {
			const res = await fetch("http://localhost:3000/api/login", {
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
				loginForm.classList.add("hidden");
				email2fa.classList.remove("hidden");
			}
			else if (!res.ok) {
				errorDiv!.textContent = data.message;
			} else {
				localStorage.setItem("id", data.id);
				console.log("Logged in! Your Id should b in local storage?");
				history.pushState({}, '', "/");
				renderApp();
		}} catch (err) {
			errorDiv!.textContent = "Network error. Try again.";
		}
	});
}
