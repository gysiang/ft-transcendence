import { renderApp } from "../router.js";

export async function logoutHandler() {
	const id = localStorage.getItem("id");
	const data = await fetch("http://localhost:3000/api/logout", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		credentials: "include",
		body: JSON.stringify({ id }),
	});
	console.log(data);
	if (data.ok)
		localStorage.removeItem("id");

	console.log("Yey you logged out!");
	loggedOutNotify("✅ You have logged out");
	history.pushState({}, '', "/");
	renderApp();
}

export function	loggedOutNotify(logoutMsg: string, duration = 3000) {
	const smallbox = document.createElement("div");
	smallbox.className = "fixed bottom-4 left-1/2 transform -translate-x-1/2 \
		bg-gray-800 text-white px-4 py-2 rounded shadow-lg \
        opacity-0 transition-all duration-500";
	smallbox.textContent = logoutMsg;
	document.body.append(smallbox);
	//document represents the whole page<body>, which we will append smallbox to it.

    // Animate in
    setTimeout(() => {
        smallbox.classList.add("opacity-100");
    }, 50);

    // Animate out and remove after duration
    setTimeout(() => {
        smallbox.classList.remove("opacity-100");
        setTimeout(() => smallbox.remove(), 500);
    }, duration);
}
