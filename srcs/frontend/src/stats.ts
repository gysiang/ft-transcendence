import { renderHeader } from "./components/header.ts";
import { Chart }from 'chart.js/auto';
import { DoughnutController, ArcElement, 
		BarController, BarElement, CategoryScale, LinearScale,
		Decimation, SubTitle, Title, Tooltip, Legend } from 'chart.js'; 	// these are from here:
													//https://www.chartjs.org/docs/latest/getting-started/integration.html

// register controllers and elements
Chart.register(
  DoughnutController, ArcElement,
  BarController, BarElement, CategoryScale, LinearScale,
  Decimation, SubTitle, Title, Tooltip, Legend
);

const ctx = document.getElementById("myChart") as HTMLCanvasElement;

new Chart(ctx, {
  type: "doughnut",
  data: {
    labels: ["Red", "Blue", "Yellow"],
    datasets: [
      {
        label: "Votes",
        data: [12, 19, 3],
        backgroundColor: ["#f87171", "#60a5fa", "#facc15"],
      },
    ],
  },
});

//reference:
// https://www.positech.co.uk/cliffsblog/2014/06/16/stats-overload-a-lesson-in-game-over-design/
// https://www.chartjs.org/docs/latest/getting-started/
// https://www.igniteui.com/doughnut-chart/overview

//installed:
//npm install chart.js
export async function statsProfile(container: HTMLElement) {
    renderHeader(container);

	try {
		const user = await obtainBackendData("profile");
		console.log("THIS data is from stats.ts:", user);
		//--------------------------Wrapper(stats) Section--------------------------
			//First, Create 1 box that houses 4 boxes in total.
			const statsWrapper = document.createElement("div");
			statsWrapper.id = "stats_data";
			statsWrapper.className = "h-screen w-full flex flex-row items-center \
									justify-center bg-gray-100 dark:bg-slate-900";

			// 1) box that contains profile pic with name on bottom
			const profile_user = document.createElement("div");
			profile_user.id = "pieline_chart";
			profile_user.className = "flex flex-col max-w-sm justify-center items-center \
									bg-stone-400 p-6 outline outline-black/5 \
									dark:bg-slate-800 dark:shadow-none \
									dark:-outline-offset-1 dark:outline-white/10";
				// 1.1)profile img and name
				const p_img = document.createElement("img");
				p_img.src = user.profile_picture;
				p_img.alt = `${user.name}'s profile picture`;
				p_img.className = "w-24 h-24 rounded-full object-cover shadow-lg/40";
				const p_name = document.createElement("p");
				p_name.className = "text-lg font-bold text-center text-gray-900 dark:text-white text-shadow-lg/15";
				p_name.textContent = "User: " + user.name// Put user's name inside the <p>
				profile_user.append(p_img, p_name);


			// 2) This box contains both the line and donut chart of the total wins and losses
			const stats_ranking = document.createElement("div");
			stats_ranking.id = "ranking";
			stats_ranking.className = "flex flex-col max-w-sm justify-center items-center \
									bg-stone-400 p-6 outline outline-black/5 \
									dark:bg-slate-800 dark:shadow-none \
									dark:-outline-offset-1 dark:outline-white/10";
				//2.1) Top is donut + line chart and bottom will contain the legends
				const donutlineWrapper = document.createElement("div");
				donutlineWrapper.className = "flex flex-row"
				// Donut chart
				const donutCanvas = document.createElement("canvas");
				donutCanvas.id = "donutChart";
				donutCanvas.className = "max-w-sm w-full bg-white rounded-lg shadow-sm dark:bg-gray-800 p-4 md:p-6";
				// Line chart
				const lineCanvas = document.createElement("canvas");
				lineCanvas.id = "lineChart";
				lineCanvas.className = "max-w-sm w-full bg-white rounded-lg shadow-sm dark:bg-gray-800 p-4 md:p-6";

				donutlineWrapper.append(donutCanvas, lineCanvas);
				stats_ranking.appendChild(donutlineWrapper);


				
				
			// 3) box that contains the Latest data from the last tournament, Show "Play a tournament to get data" if empty!
			const totalmatches_against_others = document.createElement("div");
			totalmatches_against_others.id = "total_matches_played";
			totalmatches_against_others.className = "flex max-w-sm justify-center items-center \
									bg-stone-400 p-6 outline outline-black/5 \
									dark:bg-slate-800 dark:shadow-none \
									dark:-outline-offset-1 dark:outline-white/10";

			//append stuff
			statsWrapper.append(profile_user, stats_ranking, totalmatches_against_others);
		//--------------------------Wrapper(stats) Section--------------------------
		container.appendChild(statsWrapper);
	


	//--------------------------Charts--------------------------
    // Example stats (replace with user’s actual data when available)
    const wins = 12;
    const losses = 5;

    // Donut chart
    new Chart(donutCanvas, {
		type: "doughnut",
		data: {
			labels: ["Wins", "Losses"],
			datasets: [
			{
				label: "Game Results",
				data: [wins, losses],
				backgroundColor: ["#4ade80", "#f87171"], // green & red
			},
			],
		},
    });

    // Line chart
    new Chart(lineCanvas, {
      type: "line",
      data: {
        labels: ["Jan", "Feb", "Mar", "Apr"], // x-axis labels
        datasets: [
          {
            label: "Wins",
            data: [3, 5, 2, 6],
            borderColor: "#4ade80",
            fill: false,
          },
          {
            label: "Losses",
            data: [1, 2, 1, 3],
            borderColor: "#f87171",
            fill: false,
          },
        ],
      },
    });

	} catch (error) {
		console.error("Failed to load stats Page:", error);
		const errorMsg = document.createElement("p");
		errorMsg.textContent = "Failed to load stats.";
		container.appendChild(errorMsg);
	}
}

export interface BackendUserResponse {
	message: string,
	id: number,
	name: string,
	email: string,
	profile_picture: string,
	twofa_method: string | null,
}

export async function obtainBackendData(endpoint: string): Promise<BackendUserResponse> {
  const userId = localStorage.getItem("id");

  if (!userId) {
    throw new Error("No user ID found in localStorage");
  }

  const response = await fetch(`http://localhost:3000/api/${endpoint}/${userId}`, {
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(`HTTP error! Status: ${response.status}`);
  }

  return response.json() as Promise<BackendUserResponse>;
}

//export function ingame_header (header_title: string) {}
//async function players_you_fought () {
	//Rank them based on how many times you fought them
//}
//async function ranking and title () {}
