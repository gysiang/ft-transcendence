import { renderHeader } from "./components/header.ts";
import { Chart }from 'chart.js/auto';
import { DoughnutController, ArcElement,
		BarController, BarElement, CategoryScale, LinearScale,
		Decimation, SubTitle, Title, Tooltip, Legend } from 'chart.js'; 	// these are from here:
													//https://www.chartjs.org/docs/latest/getting-started/integration.html
import type { Match } from "./pong/Tournament/singleElim.ts"
//import type { CreateMatchBody } from "./pong/Tournament/backendutils.ts"

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
		const matches = await res.json();
		console.log("user:", user.name, " | userId:", userId, " | And their stats:", matches);
		console.log("THIS IS FOR JSON:---------->", JSON.stringify(matches));
		console.log("[Total_Score]User:", user.name, matches.data.length);

		const wins = matches.data.filter((m: Match) => m.winner && String(m.winner) === String(user.name)).length;
		console.log ("VALUE OF WINS: ", wins);
		const losses = matches.data.length - wins;
		console.log("THIS data is from stats.ts:", user);
		//--------------------------Wrapper(stats) Section--------------------------
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
				donutWrapper.className = "w-32 h-32 relative";// fixed container
				const donutCanvas = document.createElement("canvas");
				donutCanvas.id = "donutChart";
				donutCanvas.className = "w-32 h-32 p-1";
				const scoreWrapper = document.createElement("div");
				scoreWrapper.className = "flex flex-col justify-center items-center"
				const scoreWins = document.createElement("p");
				scoreWins.className = "text-lg font-bold text-center text-gray-900/50 dark:text-white"
				scoreWins.textContent = "WINS"
				const wins_percent = ((wins / matches.data.length) * 100).toFixed(2);
				const scoreWins_score = document.createElement("p");
				scoreWins_score.className = "text-2xl font-bold text-center text-white dark:text-white"
				scoreWins_score.textContent = `${wins_percent}` + "%";

				const gamescore_Wrapper = document.createElement("div");
				gamescore_Wrapper.className = "flex flex-col";
				const game_score_header = document.createElement("p");
				game_score_header.className = "place-content-center text-lg font-bold text-center text-gray-900/50 dark:text-white";
				game_score_header.textContent = "GAME SCORE:";
				const game_score = (wins * 10000) - (losses * 100);
				const game_score_text = document.createElement("p");
				game_score_text.className = "place-content-center text-2xl font-bold text-center text-white dark:text-white";
				game_score_text.textContent = `${game_score}`;
				gamescore_Wrapper.append(game_score_header, game_score_text);

				donutWrapper.appendChild(donutCanvas);
				scoreWrapper.append(scoreWins, scoreWins_score);
				donutchartWrapper.append(donutWrapper, scoreWrapper, gamescore_Wrapper);
				stats_ranking.append(donutchartWrapper, gamescore_Wrapper);


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

			



			//4) here include the total matches you played 
			const match_history = document.createElement("div");
			match_history.id = "match_history";
			match_history.className = "flex flex-col place-content-center w-180 h-64 justify-center items-center \
									bg-stone-400 outline outline-black/5 \
									dark:bg-slate-800 dark:shadow-none \
									dark:-outline-offset-1 dark:outline-white/10";
				//Time to include text
				const wrap_played_and_img = document.createElement("div");
				wrap_played_and_img.className = "flex flex-row"
				const wrap_played_text = document.createElement("div");
				wrap_played_text.className = "place-content-center flex flex-col"
					const match_played_wins = document.createElement("p");
					match_played_wins.className = "place-content-center text-xl font-bold text-center text-green-800 dark:text-white"
					match_played_wins.textContent = "Total Matches won: " + wins;
					const match_played_loss = document.createElement("p");
					match_played_loss.className = "place-content-center text-xl font-bold text-center text-red-800 dark:text-white"
					match_played_loss.textContent = "Total Matches lost: " + losses;
					const tips_img = document.createElement("img");
					fetch('../imgs/Bronze_badge.png', { method: "HEAD" })
						.then(badge_res => {
							if (badge_res.ok) {
								player_rank_msg.textContent = "BRONZE RANK";
								tips_img.src = '../imgs/joystick.png';
								tips_img.className = "w-24 h-24";
							} else {
								console.warn("Badge image not found!");
							}
						})
						.catch(err => console.error("Error checking badge image:", err));
				wrap_played_text.append(match_played_wins, match_played_loss);
				wrap_played_and_img.append(tips_img, wrap_played_text);
				const tips = document.createElement("p");
				tips.className = "flex p-10";
				//tips.textContent = "Tips: Damn you need to play more."
				tips.textContent = "Tips: Okay you should stop playing and pay me to make this game better."
				if (wins >= 5 && wins < 10) {
					tips.textContent = "Tips: Trying poking your opponent in real life beside you, distract them •ᴗ•"
				} else if (wins >= 10 && wins < 15) {
					tips.textContent = "Tips: Try joining a 42 school and learn how to hack, maybe you can win that way"
				} else {
					tips.textContent = "Tips: Okay you should stop playing and pay me to make this game better"
				}
				
				
				
				match_history.append(wrap_played_and_img, tips);

			// 4.5) Ranking
			const player_rank_score = document.createElement("div");
			player_rank_score.id = "rank";
			player_rank_score.className = "place-content-center w-90 h-64 flex flex-col justify-center items-center \
									bg-stone-400 outline outline-black/5 \
									dark:bg-slate-800 dark:shadow-none \
									dark:-outline-offset-1 dark:outline-white/10";
				//Time to rank you based on how many wins
				const player_rank_msg = document.createElement("p");
				player_rank_msg.className = "place-content-center text-2xl font-bold p-5 text-center";
				player_rank_msg.textContent = "NEWBIE RANK";
				const player_rank_badge = document.createElement("img");
				player_rank_badge.className = "w-24 h-24";
				fetch('../imgs/Bronze_badge.png', { method: "HEAD" })
					.then(badge_res => {
						if (badge_res.ok) {
							player_rank_badge.src = '../imgs/Newbie_badge.png';
						} else {
							console.warn("Badge image not found!");
						}
					})
					.catch(err => console.error("Error checking badge image:", err));
				/*
				const p_img = document.createElement("img");
				p_img.src = user.profile_picture;
				p_img.alt = `${user.name}'s profile picture`;
				p_img.className = "w-24 h-24 rounded-full object-cover shadow-lg/40";
				const p_name = document.createElement("p");
				p_name.className = "text-lg font-bold text-center text-gray-900 dark:text-white text-shadow-lg/15";
				p_name.textContent = "User: " + user.name// Put user's name inside the <p>
				profile_user.append(p_img, p_name);
				*/
				//why use .then()? what is it for?
				if (wins >= 5 && wins < 10) {
					fetch('../imgs/Bronze_badge.png', { method: "HEAD" })
					.then(badge_res => {
						if (badge_res.ok) {
							player_rank_msg.textContent = "BRONZE RANK";
							player_rank_badge.src = '../imgs/Bronze_badge.png';
						} else {
							console.warn("Badge image not found!");
						}
					})
					.catch(err => console.error("Error checking badge image:", err));
				} else if (wins >= 10 && wins < 15) {
					fetch('../imgs/Bronze_badge.png', { method: "HEAD" })
					.then(badge_res => {
						if (badge_res.ok) {
							player_rank_msg.textContent = "BRONZE RANK";
							player_rank_badge.src = '../imgs/Bronze_badge.png';
						} else {
							console.warn("Badge image not found!");
						}
					})
					.catch(err => console.error("Error checking badge image:", err));
					player_rank_msg.textContent = "SLIVER RANK";
					player_rank_badge.src = '../imgs/Bronze_badge.png';
				} else if (wins > 15) {
					fetch('../imgs/Bronze_badge.png', { method: "HEAD" })
					.then(badge_res => {
						if (badge_res.ok) {
							player_rank_msg.textContent = "BRONZE RANK";
							player_rank_badge.src = '../imgs/Sliver_badge.png';
						} else {
							console.warn("Badge image not found!");
						}
					})
					.catch(err => console.error("Error checking badge image:", err));
					player_rank_msg.textContent = "GOLD RANK";
					player_rank_badge.src = '../imgs/Gold_badge.png';
				} else {
					player_rank_msg.textContent = "GOLD RANK";
				}
				player_rank_score.append(player_rank_badge, player_rank_msg);

				




			//----FINAL step, append stuff----
			const statsWrapper = document.createElement("div");
			statsWrapper.id = "stats_data";
			statsWrapper.className = "w-full flex flex-row items-center \
									justify-center bg-gray-100 dark:bg-slate-900";

			const other_data = document.createElement("div");
			other_data.id = "other_data";
			other_data.className = "w-full flex flex-row items-center \
									justify-center bg-gray-100 dark:bg-slate-900";

			const profile_column = document.createElement("div");
			profile_column.className = "h-screen w-full flex flex-col items-center \
									justify-center bg-gray-100 dark:bg-slate-900"

			statsWrapper.append(totalmatches_against_others, stats_ranking, profile_user);
			other_data.append(player_rank_score, match_history);
			profile_column.append(statsWrapper, other_data);


		//--------------------------Wrapper(stats) Section--------------------------
		container.appendChild(profile_column);



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

	//1) Tournament entry + tournament_ID
	const tournamentsMap = new Map<number, { name: string; tourney_wins: number; tourney_losses: number }>();
	
	//2) Update the tournamentsMap
	matches.data.forEach((m: CreateMatchBody) => {
		const tournamentId = Number(m.tournament_id);
		console.log("VALUE OF THIS TOURNAMENT ID BTW:_____>", tournamentId);

		if (!tournamentsMap.has(tournamentId)) {
			tournamentsMap.set(tournamentId, {
			name: `Tourney-${tournamentId}`, // You can replace with actual tournament name if available
			tourney_wins: 0,
			tourney_losses: 0,
			})
		}

		// (tournamentId)! the '!' is used here cause i am very sure the tournament exists in the map
		const t = tournamentsMap.get(tournamentId)!;
		// Check if current user is the winner or loser
		if (String(m.winner) ===  user.name) {
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

	//4) Make it show only the latest 10 matches:
	const MAX_TOURNEYS = 10;
	const slicedLabels = tournamentLabels.slice(-MAX_TOURNEYS);
	const slicedWins = winsData.slice(-MAX_TOURNEYS);
	const slicedLosses = lossesData.slice(-MAX_TOURNEYS);
	
	//5) update with tournamentID (also why type line?)
    new Chart(lineCanvas, {
      type: "line",
	  options: {
			responsive: true,
			maintainAspectRatio: false,
		},
      data: {
        labels: slicedLabels.length > 0 ? slicedLabels : ["No tournaments yet"],
        datasets: [
          {
            label: "Wins",
            data: slicedLabels.length > 0 ? slicedWins : [0],
            borderColor: "#2bc933ff",
            fill: false,
          },
          {
            label: "Losses",
            data: slicedLabels.length > 0 ? slicedLosses : [0],
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

//From Divya's code
export type CreateMatchBody = {
	player1_alias: string;
	player2_alias: string;
	player1_score: number;
	player2_score: number;
	winner: string;
	tournament_id: number | string;
};

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
