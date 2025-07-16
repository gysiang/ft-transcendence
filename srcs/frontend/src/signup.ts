import { createHeader } from "./components/header";
import { renderApp } from "./router";

export function renderSignUpPage(container: HTMLElement) {

	container.innerHTML = "";

	const header = createHeader();
	container.appendChild(header);

	const loginForm = document.createElement("loginForm");

	loginForm.innerHTML = `
	<div class="h-screen flex items-center justify-center flex-col bg-gray-100">
	<h1 class="text-2xl font-bold">Sign Up</h1>
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
		<button class="w-2xs bg-sky-500 text-white p-2 rounded-md">Sign Up</button>
		<div id="error" class="text-red-500 mt-2"></div>
	</form>
  </div>
  `


}
