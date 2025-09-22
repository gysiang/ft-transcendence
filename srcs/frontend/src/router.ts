import { renderLoginPage } from "./login.js";
import { renderHomePage } from "./home.js";
import { renderSignUpPage } from "./signup";
import { renderProfilePage } from "./profile.js";
import { renderFriendsPage } from "./friends.js";
import { statsProfile } from "./stats.js";
import { renderGameModes } from "./pong/ui/gameMode.js";

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
		marcus_renderProfilePage(app);
	} else if (path === '/profile/update_profile') {
		renderProfilePage(app);
	} else if (path === '/play'){
		renderGameModes(app);
	}else if (path == '/friends') {
		renderFriendsPage(app);
	} else if (path == '/profile/stats') {
		statsProfile(app);
	}
}
