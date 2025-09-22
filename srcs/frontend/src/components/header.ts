import { logoutHandler } from "../handlers/logoutHandler.js";

export function createHeader(): HTMLElement {
    const header = document.createElement("header");
    header.className = "w-full bg-gray-800 text-white p-4 flex justify-between items-center";

    // Logo
    const logo = document.createElement("div");
    logo.className = "text-lg font-bold";
    logo.textContent = "PONG";
    header.append(logo);

    // Navigation container
    const nav = document.createElement("nav");
    nav.className = "flex-col sm:flex-row sm:flex-wrap space-x-4";
    header.append(nav);

    // Helper function to create a menu item
    const createMenuItem = (text: string, href: string, tooltip: string): HTMLElement => {
        const wrapper = document.createElement("div"); //outer div
        wrapper.className = "relative group inline-block";

        const link = document.createElement("a");
        link.href = href; //the "/location"
        link.className = "hover:underline w-2xs bg-sky-500 text-white p-2 rounded-md";
        link.textContent = text; // For textbox name

        const tooltipDiv = document.createElement("div");
        tooltipDiv.className =
            "tooltip absolute left-0 mt-1 w-max text-sm text-gray-800 bg-white border border-gray-300 rounded shadow-lg px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none transition-all duration-1000";
        tooltipDiv.textContent = tooltip;

        wrapper.append(link, tooltipDiv);
        return wrapper;
    };

    // Home
	nav.append(createMenuItem("Home", "/", "Return Home~"));

	const isLoggedIn = !!localStorage.getItem("id");
	if (isLoggedIn)
	{
        // Main Profile
		const marcus_profileItem = createMenuItem("Profile", "/profile", "Check your info here!");
        marcus_profileItem.querySelector(".tooltip")?.classList.remove("left-0");
		marcus_profileItem.querySelector(".tooltip")?.classList.add("-left-20");
		nav.append(marcus_profileItem);

		// friends
		const friendsItem = createMenuItem("Friends", "/friends", "Friends~");
		friendsItem.querySelector(".tooltip")?.classList.remove("left-0");
		friendsItem.querySelector(".tooltip")?.classList.add("-left-1");
		nav.append(friendsItem);

        //logout
        const logoutbutton = createMenuItem("Log Out", "/", "Log Out");
        logoutbutton.addEventListener("click", (e: Event) => {
			e.preventDefault(); // prevents navigation to "#"
			logoutHandler();
		});
		nav.append(logoutbutton);
	} else {
        // Sign In
        nav.appendChild(createMenuItem("Sign In", "/login", "Sign in!"));

        // Sign Up
        const signUpItem = createMenuItem("Sign Up", "/signup", "Check your stats here!");
        signUpItem.querySelector("div")!.classList.remove("left-0");
        signUpItem.querySelector("div")!.classList.add("right-0");
        nav.append(signUpItem);
    }
    return header;
}

export function	renderHeader(container: HTMLElement) {
	container.innerHTML = ""; // clear old header, empties it.
	const header = createHeader(); // automatically reads localStorage
	container.append(header);
}
