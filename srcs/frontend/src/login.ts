import { createHeader } from "./components/header";
import { renderApp } from "./router";

export function renderLoginPage(container: HTMLElement) {

	container.innerHTML = "";

	const header = createHeader();
	container.appendChild(header);

	const loginForm = document.createElement("loginForm");

	loginForm.innerHTML = `
    <div class="h-screen flex items-center justify-center flex-col bg-gray-100">
	<h1 class="text-2xl font-bold">Login</h1>
	<form id="login-form" class="space-y-1">
		<input
			id="username"
			type="text"
			placeholder="Username"
			class="w-2xs text-center border-grey-500 border-1 border-solid rounded p-1"
			required />
			<br>
		<input
			id="password"
			type="password"
			placeholder="Password"
			class="w-2xs text-center border-grey-500 border-1 border-solid rounded p-1"
			required />
		<br>
		<button class="w-2xs bg-sky-500 text-white p-2 rounded-md">Login</button>
		<div id="error" class="text-red-500 mt-2"></div>
	</form>
  </div>
  `
	container.appendChild(loginForm);

	// handle the login click

	const form = document.getElementById("loginForm") as HTMLFormElement;
	const errorDiv = document.getElementById("error") as HTMLFormElement;

	form.onsubmit = async (e) => {
		e.preventDefault();
		const username = (document.getElementById("username") as HTMLInputElement).value;
		const password = (document.getElementById("password") as HTMLInputElement).value;

		try {
			const res = await fetch("/api/login", {
				method: "POST",
				headers : {"Content-Type": "application/json"},
				body: JSON.stringify({ username, password }),
				credentials: "include"
			});

			if (!res.ok)
				throw new Error("Invalid Login");

			const { token } = await res.json();
			localStorage.setItem("auth_token", token);
			window.history.pushState({}, "", "/home");
			renderApp();
		} catch (err) {
			errorDiv.textContent = "Login Failed.";
		}
	}
}
