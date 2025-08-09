export function createHeader() : HTMLElement {

	const header = document.createElement("header");
	header.className = "w-full bg-gray-800 text-white p-4 flex justify-between items-center";

	header.innerHTML = `
		<div class="text-lg font-bold">PONG</div>
		<nav class="space-x-4">
		<a href="/" class="hover:underline">Home</a>
		<a href="/profile" class="hover:underline">Profile</a>
		</nav>
	`;

	return (header);
}
