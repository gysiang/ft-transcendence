import { createHeader } from "./components/header";

export function renderHomePage(container: HTMLElement) {

	container.innerHTML = "";
	const header = createHeader();

	container.appendChild(header);

	const homeBody = document.createElement("homeBody");

	homeBody.innerHTML = `
		<h1 class="text-2xl">Welcome to the Home Page</h1>
	`;
	container.appendChild(homeBody);
	return container;
}
