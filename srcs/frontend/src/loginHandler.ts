import { renderApp } from "./router";


export async function loginHandler(e: Event) {
	e.preventDefault();

	const username = (document.getElementById("username") as HTMLInputElement).value;
	const password = (document.getElementById("password") as HTMLInputElement).value;

	try {
		const res = await fetch("/api/login", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ username, password }),
			credentials: "include"
		});

		if (!res.ok)
			throw new Error("Invalid Login");

		const { token } = await res.json();
		localStorage.setItem("auth_token", token);

		// Navigate to /home and render app
		window.history.pushState({}, "", "/home");
		renderApp();
	} catch (err) {
		errorDiv.textContent = "Login Failed.";
	}
}
