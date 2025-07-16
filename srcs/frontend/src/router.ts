import { renderLoginPage } from "./login";
import { renderHomePage } from "./home";
import { renderSignUpPage } from "./signup";

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

}
