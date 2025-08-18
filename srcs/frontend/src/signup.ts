import { renderHeader } from "./components/header";
import { signupHandler, googleHandler } from "./handlers/signupHandler";

export function renderSignUpPage(container: HTMLElement) {

	renderHeader(container);

	const signUpForm = document.createElement("div");

	signUpForm.innerHTML = `
	<div class="h-screen flex items-center justify-center flex-col bg-gray-100">
	<h1 class="text-2xl font-bold">Sign Up</h1>
	<form id="signup-form" class="space-y-1">
		<input
			id="name"
			type="text"
			placeholder="name"
			class="w-2xs text-center border-grey-500 border-1 border-solid rounded p-1"
			required />
		<br>
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
		<button type="submit" class="w-2xs bg-sky-500 text-white p-2 rounded-md">Sign Up</button>
		<div id="error" class="text-red-500 mt-2"></div>
	</form>
		<button id="google-login-btn" class="w-2xs border-black border-solid p-2">Sign in with Google</button>
  </div>
  `
	container.appendChild(signUpForm);
	signupHandler("signup-form");
	googleHandler("google-login-btn");
}
