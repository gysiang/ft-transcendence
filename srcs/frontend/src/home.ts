import { renderHeader } from "./components/header";
import { openWs } from "./wsClient"; 

//For reference:
//https://tailwind.build/classes
export async function renderHomePage(container: HTMLElement) {

	renderHeader(container);

	const homePage = document.createElement("div");
	homePage.className = "h-screen flex items-center justify-center flex-col bg-gray-100";

	//title
	const title = document.createElement("h1");
	title.className = "text-2xl font-bold text-center";

	//name of the logged in user
	const user_name = document.createElement("span");
	user_name.className = "text-2xl font-bold underline text-center";
	user_name.textContent = "User";

	const isLoggedIn = localStorage.getItem("id");//get the user id
	if (isLoggedIn) {
		title.append(document.createTextNode("Welcome\""));
		title.append(user_name);//insert name here (test atm)
		title.append(document.createTextNode("\"!"));
		title.append(document.createElement("br"));
		title.append(document.createTextNode("Another Good Day to play pong!"));
	} else {
		title.append(document.createTextNode("Hello!"));
		title.append(document.createElement("br"));
		title.append(document.createTextNode("Welcome to our FT_Transcendence Project!"));
	}

	if (isLoggedIn) {
		try {
			const response = await fetch(`http://localhost:3000/api/profile/${isLoggedIn}`, {
				credentials: "include"
			});
			if (!response.ok) {
				throw new Error(`HTTP error! Status: ${response.status}`);
			}
		const user = await response.json();
		user_name.textContent = user.name;
		} catch (err) {
			console.error("Failed to load user:", err);
      		user_name.textContent = "Error.exe";
		}
	}

	// button to play! These start in the center due to the parent container
	// Link button
    const link = document.createElement("a");
    link.href = "/play";
    link.className = "hover:underline w-2xs bg-sky-500 text-white p-2 rounded-md text-center animate-pulse p-2 text-white text-sm";
    link.textContent = "Open The Game!";

	// Tooltip
    const tooltipDiv = document.createElement("div");
    tooltipDiv.className =
        "tooltip absolute left-1/2 -translate-x-1/2 mt-1 w-max text-sm text-gray-800 bg-white border border-gray-300 rounded shadow-lg px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none transition-all duration-1000";
    tooltipDiv.textContent = "GO AHEAD MR JOESTAR!";

	// Append link and tooltip to wrapper
	const wrapper = document.createElement("div");
    wrapper.className = "relative group inline-block";
    wrapper.append(link, tooltipDiv);
	const wsBtn = document.createElement('button');
  wsBtn.className = 'mt-6 px-3 py-2 border rounded bg-gray-800 text-white hover:bg-gray-700';
  wsBtn.textContent = 'Test WebSocket';
  wsBtn.onclick = () => {
    const client = openWs({
      onStart: (m) => console.log('[UI] onStart', m),
      onState: (s) => console.log('[UI] onState', s),
      onEnd:   (e) => console.log('[UI] onEnd', e),
    });
    (window as any).wsTest = client; // optional: use from console
  };

  // Button: quickmatch
  const qmBtn = document.createElement('button');
  qmBtn.className = 'mt-2 px-3 py-2 border rounded bg-sky-600 text-white hover:bg-sky-500';
  qmBtn.textContent = 'Quickmatch Online';
  qmBtn.onclick = () => {
    const api = (window as any).wsTest ?? openWs(); // ensure a connection
    (window as any).wsTest = api;
    api.queue(5); // optional goalLimit
  };
  
	// append to page
	homePage.append(title, wrapper, wsBtn,qmBtn); 

	// append to page
	homePage.append(title, wrapper);
	container.append(homePage);

   return container;
}





























    // Main container for home page content
    // const homeContainer = document.createElement("div");
    // homeContainer.className = "h-screen flex items-center justify-center flex-col bg-gray-100";

    // // Title
    // const title = document.createElement("h1");
    // title.className = "text-2xl font-bold";
    // title.textContent = "Welcome to Our Ft_transcendence Project!";

    // // Play button wrapper
    // const wrapper = document.createElement("div");
    // wrapper.className = "relative group inline-block";

    // // Link button
    // const link = document.createElement("a");
    // link.href = "/play";
    // link.className = "hover:underline w-2xs bg-sky-500 text-white p-2 rounded-md";
    // link.textContent = "Open The Game!";

    // // Tooltip
    // const tooltipDiv = document.createElement("div");
    // tooltipDiv.className =
    //     "tooltip absolute left-0 mt-1 w-max text-sm text-gray-800 bg-white border border-gray-300 rounded shadow-lg px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none transition-all duration-1000";
    // tooltipDiv.textContent = "GO AHEAD MR JOESTAR!";

    // // Append link and tooltip to wrapper
    // wrapper.append(link, tooltipDiv);

    // // Append title and wrapper to home container
    // homeContainer.append(title, wrapper);

    // // Append everything to the page container
    // container.append(homeContainer);