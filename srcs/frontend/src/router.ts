import { renderLoginPage } from "./login.js";
import { renderHomePage } from "./home.js";
import { renderSignUpPage } from "./signup";
import { startGame } from "./pong/launch.js"
import { createGameCanvas } from "./pong/Renderer.js";

export function renderApp() {
	const app = document.getElementById("app")!;
	app.innerHTML = "";

	const path = window.location.pathname;
	if (path === "/login") {
		renderLoginPage(app);
	} else if (path == "/signup") {
		renderSignUpPage(app);
	}
	else if (path === "/") {
		renderHomePage(app);
	}
	else if  (path ==="/game") {
		const canvas = createGameCanvas();
		app.appendChild(canvas);
		startGame(canvas);
		}

}
