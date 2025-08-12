
//export function createHeader(showProfile: boolean = true): HTMLElement {
export function createHeader(showProfile: boolean = true): HTMLElement {
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
		// relative — positions the tooltip relative to this container.
		// group — used so group-hover works on tooltip.
		// inline-block — makes it fit content width.

        const link = document.createElement("a");
        link.href = href; //the "/location"
        link.dataset.link = "true";
        link.className = "hover:underline w-2xs bg-sky-500 text-white p-2 rounded-md";
        link.textContent = text; // For textbox name

        const tooltipDiv = document.createElement("div");
        tooltipDiv.className =
            "absolute left-0 mt-1 w-max text-sm text-gray-800 bg-white border border-gray-300 rounded shadow-lg px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none transition-all duration-1000";
        tooltipDiv.textContent = tooltip; //prints out the string u wanna write

        wrapper.append(link, tooltipDiv);

        return wrapper;
    };

    // Home
	nav.append(createMenuItem("Home", "/", "Return Home~"));







	



	// Auto-check login
    //get the user id
	const isLoggedIn = !!localStorage.getItem("id");
	if (isLoggedIn)
	{
		const profileItem = createMenuItem("Profile", "/profile", "Check your profile");
		profileItem.querySelector("div:nth-child(2)")?.classList.remove("left-0");
		profileItem.querySelector("div:nth-child(2)")?.classList.add("-left-20");
		nav.append(profileItem);
	}

    // // Profile (conditionally rendered)
    // if (showProfile)
	// {
    //      const profileItem = createMenuItem("Profile", "/profile", "For those who haven't signed up for the game");
    //      profileItem.querySelector("div:nth-child(2)")?.classList.remove("left-0");
	//      profileItem.querySelector("div:nth-child(2)")?.classList.add("-left-20");
    //      nav.append(profileItem);
    // }









    // Sign In
    nav.appendChild(createMenuItem("Sign In", "/login", "Sign in!"));

    // Sign Up
    const signUpItem = createMenuItem("Sign Up", "/signup", "Check your stats here!");
    signUpItem.querySelector("div")!.classList.remove("left-0");
    signUpItem.querySelector("div")!.classList.add("right-0");
    nav.append(signUpItem);

    return header;
}









//old code with tailwind.css focus
// export function createHeader() : HTMLElement {

// 	const header = document.createElement("header");
// 	header.className = "w-full bg-gray-800 text-white p-4 flex justify-between items-center";

// 	//better to use typescript for jobs
// 	header.innerHTML = `
// 		<div class="text-lg font-bold">PONG</div>
// 		<nav class="flex-col sm:flex-row sm:flex-wrap space-x-4>
// 			<div class="relative group inline-block">
// 				<a href="/" class="hover:underline w-2xs bg-sky-500 text-white p-2 rounded-md data-link="true"">Home</a>
// 				<div class="absolute left-0 mt-1 w-max text-sm text-gray-800 bg-white border border-gray-300 rounded shadow-lg px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none transition-all duration-1000">
// 					Return Home~
// 				</div>
// 			</div>
// 			<div class="relative group inline-block profile-box">
//                 <a href="/profile" class="hover:underline w-2xs bg-sky-500 text-white p-2 rounded-md" data-link="true">Profile</a>
//                 <div class="absolute -left-15 mt-1 w-max text-sm text-gray-800 bg-white border border-gray-300 rounded shadow-lg px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none transition-all duration-1000">
//                     Check your stats here!
//                 </div>
//             </div>
// 			<div class="relative group inline-block">
// 				<a href="/signin" class="hover:underline w-2xs bg-sky-500 text-white p-2 rounded-md data-link="true">Sign In</a>
// 				<div class="absolute left-0 mt-1 w-max text-sm text-gray-800 bg-white border border-gray-300 rounded shadow-lg px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none transition-all duration-1000">
// 					Sign in!
// 				</div>
// 			</div>
// 			<div class="relative group inline-block">
// 				<a href="/signup" class="hover:underline w-2xs bg-sky-500 text-white p-2 rounded-md data-link="true">Sign Up</a>
// 				<div class="absolute right-0 mt-1 w-max text-sm text-gray-800 bg-white border border-gray-300 rounded shadow-lg px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none transition-all duration-1000">
// 					For those who haven't signed up for the game
// 				</div>
// 			</div>
// 		</nav>
// 	`;

// 	// Hide profile box using Tailwind's 'hidden' class
//     const	profileBox = header.querySelector(".profile-box") as HTMLElement;
//     if (profileBox)
// 	{
//         profileBox.classList.add("hidden");
//         // Or to completely remove: profileBox.remove();
//     }
// 	return (header);
// }
