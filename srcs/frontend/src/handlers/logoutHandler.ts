import { renderHeader } from "../components/header";

export async function logoutHandler() {
	// 1️⃣ remove localStorage ID
	localStorage.removeItem("id");

	// 2️⃣ optional: tell backend
	await fetch("http://localhost:3000/api/logout", { method: "POST", credentials: "include", });

	// 3️⃣ optional: update header or page
	console.log("Yey you logged out!");
	//show small window you have left
	loggedOutNotify("✅ You have logged out");
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
