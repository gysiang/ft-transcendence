import { createHeader } from "./components/header";

export function renderHomePage(container: HTMLElement) {

	container.innerHTML = "";
	const header = createHeader();

	container.appendChild(header);


	return container;
}


/** *
export function renderHomePage(container: HTMLElement) {
  container.innerHTML = `
    <h1 class="text-2xl">Welcome to the Home Page</h1>
  `;
}
**/
