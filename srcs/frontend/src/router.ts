import { renderLoginPage } from "./login";
import { renderHomePage } from "./home";

export function renderApp() {
	const app = document.getElementById("app")!;
	app.innerHTML = "";

	const path = window.location.pathname;
	if (path === "/login") {
		renderLoginPage(app);
	} else if (path === "/") {
		renderHomePage(app);
	}

}

/**
export function renderApp() {
  const app = document.getElementById("app")!;
  app.innerHTML = "<h1>Hello, this should show!</h1>";
}

**/
