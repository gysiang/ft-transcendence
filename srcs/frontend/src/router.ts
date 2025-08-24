import { renderLoginPage } from "./login.js";
import { renderHomePage } from "./home.js";
import { renderSignUpPage } from "./signup";
import { renderProfilePage } from "./profile.js";
import { renderModes } from "./pong/registration/modes.js";


//delete later
import { marcus_renderProfilePage } from "./marcus_profile.js"


export function renderApp() {
	const app = document.getElementById("app")!;
	app.innerHTML = "";

	const path = window.location.pathname;
	if (path === '/login') {
		renderLoginPage(app);
	} else if (path === '/signup') {
		renderSignUpPage(app);
	} else if (path === '/') {
		renderHomePage(app);
	} else if (path === '/profile') {
		renderProfilePage(app);
	} else if (path === '/marcus_profile') {
		marcus_renderProfilePage(app);
	} else if (path === '/play'){
		renderModes(app);
	}
}
