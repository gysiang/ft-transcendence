import { renderHeader } from "./components/header.ts";
import { Chart }from 'chart.js/auto';
import { DoughnutController, ArcElement,
		BarController, BarElement, CategoryScale, LinearScale,
		Decimation, SubTitle, Title, Tooltip, Legend } from 'chart.js'; 	// these are from here:
													//https://www.chartjs.org/docs/latest/getting-started/integration.html
import type { Match } from "./pong/Tournament/singleElim.ts"
import type { CreateMatchBody } from "./pong/Tournament/backendutils.ts"

// register controllers and elements
Chart.register(
  DoughnutController, ArcElement,
  BarController, BarElement, CategoryScale, LinearScale,
  Decimation, SubTitle, Title, Tooltip, Legend
);

// const ctx = document.getElementById("myChart") as HTMLCanvasElement;

// new Chart(ctx, {
//   type: "doughnut",
//   data: {
//     labels: ["Red", "Blue", "Yellow"],
//     datasets: [
//       {
//         label: "Votes",
//         data: [12, 19, 3],
//         backgroundColor: ["#f87171", "#60a5fa", "#facc15"],
//       },
//     ],
//   },
// });

//reference:
// https://www.positech.co.uk/cliffsblog/2014/06/16/stats-overload-a-lesson-in-game-over-design/
// https://www.chartjs.org/docs/latest/getting-started/
// https://www.igniteui.com/doughnut-chart/overview

//installed:
//npm install chart.js
export async function statsProfile(container: HTMLElement) {
    renderHeader(container);

	try {
		const userId = localStorage.getItem("id");
		if (!userId) {
			throw new Error("No user ID found in localStorage");
		}
		const user = await obtainBackendData("profile", userId);
		const res = await fetch(`http://localhost:3000/api/game/data/${userId}`, {
			method: "GET",
			credentials: "include",
		});
		if (!res.ok) {
			throw new Error(`HTTP error! Status: ${res.status}`);
		}
		//"true"(NaN) == true(1) -> false
		// "true" === true --> false (type, value)
		// null | undefined
		// null == undefined --> true
		// null === undefined --> false
		const matches = await res.json();
		console.log("user:", user.name, " | userId:", userId, " | And their stats:", matches);
		console.log("THIS IS FOR JSON:---------->", JSON.stringify(matches));
		console.log("[Total_Score]User:", user.name, matches.data.length);

		const wins = matches.data.filter((m: Match) => m.winner && String(m.winner) === String(user.name)).length;
		console.log ("VALUE OF WINS: ", wins);
		const losses = matches.data.length - wins;
		console.log("THIS data is from stats.ts:", user);
		//--------------------------Wrapper(stats) Section--------------------------
			//First, Create 1 box that houses 4 boxes in total.
			const statsWrapper = document.createElement("div");
			statsWrapper.id = "stats_data";
			statsWrapper.className = "h-screen w-full flex flex-row items-center \
									justify-center bg-gray-100 dark:bg-slate-900";

			// 1) box that contains the Latest data from the last tournament, Show "Play a tournament to get data" if empty!
			const totalmatches_against_others = document.createElement("div");
			totalmatches_against_others.id = "total_matches_played";
			totalmatches_against_others.className = "flex w-90 h-64 justify-center items-center \
									bg-stone-400 p-6 outline outline-black/5 \
									dark:bg-slate-800 dark:shadow-none \
									dark:-outline-offset-1 dark:outline-white/10";
				//1.1) Top is line chart and bottom will be total matches played
				const linechartWrapper = document.createElement("div");
				linechartWrapper.className = "flex flex-col max-w-sm"
				const lineWrapper = document.createElement("div");
				lineWrapper.className = "w-76 h-32 relative"; // fixed container
				// Line chart
				const lineCanvas = document.createElement("canvas");
				lineCanvas.id = "lineChart";
				lineCanvas.className = "flex flex-col w-50 p-1";

				//TotalmatchesWrapper
				const totalMatchesWrapper = document.createElement("div");
				totalMatchesWrapper.className = "flex flex-col justify-center items-center"
				const totalMatches = document.createElement("p");
				totalMatches.className = "text-center text-2xl font-bold \
											text-white dark:text-white";
				totalMatches.textContent = "Total Matches played: " + matches.data.length;

				lineWrapper.appendChild(lineCanvas);
				totalMatchesWrapper.append(totalMatches);//, scoreWins_score);
				linechartWrapper.append(lineWrapper, totalMatchesWrapper);
				totalmatches_against_others.appendChild(linechartWrapper);


			// 2) This box contains the donut chart as well as the text for wins
			const stats_ranking = document.createElement("div");
			stats_ranking.id = "ranking";
			stats_ranking.className = "flex flex-col w-90 h-64 justify-center items-center \
									bg-stone-400 p-6 outline outline-black/5 \
									dark:bg-slate-800 dark:shadow-none \
									dark:-outline-offset-1 dark:outline-white/10";
				//2.1) Top is donut + line chart with text on win percentage
				const donutchartWrapper = document.createElement("div");
				donutchartWrapper.className = "flex flex-row max-w-sm"
				// Donut chart
				const donutWrapper = document.createElement("div");
				donutWrapper.className = "w-32 h-32 relative"; // fixed container
				const donutCanvas = document.createElement("canvas");
				donutCanvas.id = "donutChart";
				donutCanvas.className = "w-32 h-32 p-1";
				const scoreWrapper = document.createElement("div");
				scoreWrapper.className = "flex flex-col justify-center items-center"
				const scoreWins = document.createElement("p");
				scoreWins.className = "text-lg font-bold text-center text-gray-900/50 dark:text-white"
				scoreWins.textContent = "WINS"
				const wins_percent = (wins / matches.data.length) * 100;
				const scoreWins_score = document.createElement("p");
				scoreWins_score.className = "text-2xl font-bold text-center text-white dark:text-white"
				scoreWins_score.textContent = `${wins_percent}` + "%";

				donutWrapper.appendChild(donutCanvas);
				scoreWrapper.append(scoreWins, scoreWins_score);
				donutchartWrapper.append(donutWrapper, scoreWrapper);
				stats_ranking.appendChild(donutchartWrapper);


			//3) Profile and name
			const profile_user = document.createElement("div");
			profile_user.id = "pieline_chart";
			profile_user.className = "flex flex-col w-90 h-64 justify-center items-center \
									bg-stone-400 p-6 outline outline-black/5 \
									dark:bg-slate-800 dark:shadow-none \
									dark:-outline-offset-1 dark:outline-white/10";
				// 3.1)profile img and name
				const p_img = document.createElement("img");
				p_img.src = user.profile_picture;
				p_img.alt = `${user.name}'s profile picture`;
				p_img.className = "w-24 h-24 rounded-full object-cover shadow-lg/40";
				const p_name = document.createElement("p");
				p_name.className = "text-lg font-bold text-center text-gray-900 dark:text-white text-shadow-lg/15";
				p_name.textContent = "User: " + user.name// Put user's name inside the <p>
				profile_user.append(p_img, p_name);

			//append stuff
			statsWrapper.append(totalmatches_against_others, stats_ranking, profile_user);
		//--------------------------Wrapper(stats) Section--------------------------
		container.appendChild(statsWrapper);



	//--------------------------Charts--------------------------
    // const wins = matches.data.filter(m => m.winner === user.name).length;
    // const losses = matches.data.length - wins;

    // Donut chart
    new Chart(donutCanvas, {
		type: "doughnut",
		options: {
			responsive: true,
			maintainAspectRatio: false,
		},
		data: {
			// labels: ["Wins", "Losses"],
			datasets: [
			{
				label: "Game Results",
				data: [wins, losses],
				backgroundColor: ["#2bc933ff", "#fd0202ff"], // green & red
			},
			],
		},
    });

    //	Line chart
    // new Chart(lineCanvas, {
    //   type: "line",
	//   options: {
	// 		responsive: true,
	// 		maintainAspectRatio: false,
	// 	},
    //   data: {
    //     labels: ["Jan", "Feb", "Mar", "Apr"], // x-axis labels
    //     datasets: [
    //       {
    //         label: "Wins",
    //         data: [3, 5, 2, 6],
    //         borderColor: "#2bc933ff",
    //         fill: false,
    //       },
    //       {
    //         label: "Losses",
    //         data: [1, 2, 1, 3],
    //         borderColor: "#fd0202ff",
    //         fill: false,
    //       },
    //     ],
    //   },
    // });

	//1) Tournament entry + tournament_ID
	const tournamentsMap = new Map<number, { name: string; tourney_wins: number; tourney_losses: number }>();
	
	//2) Update the tournamentsMap
	matches.data.forEach((m: CreateMatchBody) => {
		const tournamentId = Number(m.tournament_id);
		console.log("VALUE OF THIS TOURNAMENT ID BTW:_____>", tournamentId);

		if (!tournamentsMap.has(tournamentId)) {
			tournamentsMap.set(tournamentId, {
			name: `Tourney-${tournamentId}`, // You can replace with actual tournament name if available
			tourney_wins: wins,
			tourney_losses: losses,
			})
		}
		
		// (tournamentId)! the '!' is used here cause i am very sure the tournament exists in the map
		const t = tournamentsMap.get(tournamentId)!;

		// Check if current user is the winner or loser
		if (String(m.winner) === "mlowplayer") {
			t.tourney_wins++;
		} else {
			t.tourney_losses++;
		}
	});

	//3) Extract data from tournamentsMap into arrays->labels
	const tournamentLabels: string[] = [];
	const winsData: number[] = [];
	const lossesData: number[] = [];

	for (const [, t] of tournamentsMap) {
		tournamentLabels.push(t.name);
		winsData.push(t.tourney_wins);
		lossesData.push(t.tourney_losses);
	}

	//update with tournamentID (also why type line?)
    new Chart(lineCanvas, {
      type: "line",
	  options: {
			responsive: true,
			maintainAspectRatio: false,
		},
      data: {
        labels: tournamentLabels.length > 0 ? tournamentLabels : ["No tournaments yet"],
        datasets: [
          {
            label: "Wins",
            data: tournamentLabels.length > 0 ? winsData : [0],
            borderColor: "#2bc933ff",
            fill: false,
          },
          {
            label: "Losses",
            data: tournamentLabels.length > 0 ? lossesData : [0],
            borderColor: "#fd0202ff",
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

export async function obtainBackendData(endpoint: string, userId: string): Promise<BackendUserResponse> {
  const response = await fetch(`http://localhost:3000/api/${endpoint}/${userId}`, {
	method: "GET",
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
