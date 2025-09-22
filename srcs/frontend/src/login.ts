import { renderHeader } from "./components/header";
import { loginHandler } from "./handlers/loginHandler";
import { verify2faLoginHandler } from "./handlers/2faHandler";

export function renderLoginPage(container: HTMLElement) {

	renderHeader(container);

	const loginForm = document.createElement("div");
	loginForm.innerHTML = `
	<div class="h-screen flex items-center justify-center flex-col bg-gray-100">
	<h1 class="text-2xl font-bold">Login</h1>
	<form id="login-form" class="space-y-1">
		<input
			id="email"
			type="email"
			placeholder="email"
			class="w-2xs text-center border-grey-500 border-1 border-solid rounded p-1 focus-within:text-red-600"
			required />
		<br>
		<input
			id="password"
			type="password"
			placeholder="Password"
			class="w-2xs text-center border-grey-500 border-1 border-solid rounded p-1 focus-within:text-red-600"
			required />
		<br>
		<button type="submit" class="w-2xs bg-sky-500 text-white p-2 rounded-md">Login</button>
		<div id="error" class="text-red-500 mt-2"></div>
	</form>
		<a href="/signup"
			class="text-sm text-neutral-900 text-center underline">Sign Up Here</a>
	</div>
	`
	const inputBox = document.createElement("div");
		inputBox.id = "email2fa-input";
		inputBox.className = "mt-4 hidden flex flex-col items-center space-y-4";
		inputBox.innerHTML = `
		<input
			type="text"
			id="twofa-token-email"
			placeholder="Enter 6-digit code"
			class="border p-2 rounded w-40 text-center"
		/>
		<button
			id="verify-2fa-email"
			class="bg-blue-500 text-white px-4 py-2 rounded"
		>
			Verify
	</button>`

	loginForm.querySelector("div")?.appendChild(inputBox);
	container.append(loginForm);
	loginHandler("login-form");
	verify2faLoginHandler("verify-2fa-email", "twofa-token-email");
}
