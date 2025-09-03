import { renderLoginPage } from "./login.js";
import { renderHomePage } from "./home.js";
import { renderSignUpPage } from "./signup";
import { renderProfilePage } from "./profile.js";
import { renderFriendsPage } from "./friends.js";
import { renderModes } from "./pong/registration/modes.js";

export function renderApp() {
	const app = document.getElementById("app")!;
	app.innerHTML = "";

	const path = window.location.pathname;
	if (path === "/login") {
		renderLoginPage(app);
	} else if (path === "/signup") {
		renderSignUpPage(app);
	} else if (path === "/") {
		renderHomePage(app);
	} else if (path === '/profile') {
		renderProfilePage(app);
	} else if (path ==="/play"){
		renderModes(app);
	} else if (path == '/friends') {
		renderFriendsPage(app);
	}
}
