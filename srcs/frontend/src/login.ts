import { createHeader } from "./components/header";
import { loginHandler } from "./handlers/loginHandler";

export function renderLoginPage(container: HTMLElement) {

	container.innerHTML = "";

	const header = createHeader();
	container.appendChild(header);

	const loginForm = document.createElement("div");

	loginForm.innerHTML = `
	<div class="h-screen flex items-center justify-center flex-col bg-gray-100">
	<h1 class="text-2xl font-bold">Login</h1>
	<form id="login-form" class="space-y-1">
		<input
			id="email"
			type="email"
			placeholder="email"
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
		<button type="submit" class="w-2xs bg-sky-500 text-white p-2 rounded-md">Login</button>
		<div id="error" class="text-red-500 mt-2"></div>
	</form>
		<a href="/signup"
			class="text-sm text-neutral-900 text-center underline">Sign Up Here</a>
	</div>
	`
	container.appendChild(loginForm);
	loginHandler("login-form");
}
