import { createHeader } from "./components/header";

export function renderHomePage(container: HTMLElement) {

	container.innerHTML = "";
	const header = createHeader();
	container.appendChild(header);

	const homeButtons = document.createElement("div");
	homeButtons.innerHTML = `
	<div class="h-screen flex items-center justify-center flex-col bg-gray-100">
	<h1 class="text-2xl font-bold">Welcome to Our Ft_transcendence Project!</h1>
	<form id="sign-up" class="space-y-1">
		<a href="/play" class="hover:underline w-2xs bg-sky-500 text-white p-2 rounded-md data-link="true">Play the Game</a>
		<div id="error" class="text-red-500 mt-2"></div>
	`
	container.appendChild(homeButtons);
	return container;
}

//<button type="submit" class="w-2xs bg-sky-500 text-white p-2 rounded-md">Sign in</button>
