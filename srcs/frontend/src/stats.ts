import { renderHeader } from "./components/header.ts";
//import type { CreateMatchBody } from "./pong/Tournament/backendutils.ts"
import { API_BASE } from "./variable.ts"
import { Chart } from 'chart.js/auto';
import { DoughnutController, ArcElement,
		BarController, BarElement, CategoryScale, LinearScale,
		Decimation, SubTitle, Title, Tooltip, Legend } from 'chart.js'; // these are from here:

// after import, also still need to register controllers and elements
Chart.register(
	DoughnutController, ArcElement,
	BarController, BarElement, CategoryScale, LinearScale,
	Decimation, SubTitle, Title, Tooltip, Legend 
);

type CreateMatchBody = {
	tournament_id: number;
	player1_alias: string;
	player2_alias: string | null;
	player1_score: number;
	player2_score: number;
	player1_id?: number | null;
	player2_id?: number | null;
	winner_id: number | null;
	winner_alias: string;
	created_at?: string;
	tournament_name?: string;
  };
export async function statsProfile(container: HTMLElement) {
    renderHeader(container);

	try {
		const userId = localStorage.getItem("id");
		if (!userId) {
			throw new Error("No user ID found in localStorage");
		}
		const user = await obtainBackendData("profile", userId);
		const res = await fetch(`${API_BASE}/api/game/data/${userId}`, {
			method: "GET",
			credentials: "include",
		});
		if (!res.ok) {
			throw new Error(`HTTP error! Status: ${res.status}`);
		}
		const matches = await res.json();
		const match_wins = matches.data.filter((m: CreateMatchBody) => m.winner_id && String(m.winner_id) === userId).length;
		
		const match_inTotal = matches.data.filter((m: CreateMatchBody) => 
			((m.player1_id && (String(m.player1_id) === userId) 
			|| (m.player2_id && String(m.player2_id) === userId)))).length;
		
		const match_losses = match_inTotal - match_wins;

		//1) Tournament entry + tournament_ID
		const tournamentsMap = new Map<number, { name: string; tourney_wins: number; tourney_losses: number }>();
		
		//2) Update the tournamentsMap
		matches.data.forEach((m: CreateMatchBody) => {
			const tournamentId = Number(m.tournament_id);
			if (!tournamentsMap.has(tournamentId)) {
				tournamentsMap.set(tournamentId, {
					name: m.tournament_name || `Tourney-${tournamentId}`,
					tourney_wins: 0,
					tourney_losses: 0,
				})
			}

			// (tournamentId)! the '!' is used here cause i am very sure the tournament exists in the map
			const t = tournamentsMap.get(tournamentId)!;
			//Check if the user is part of this versus match:
			if (String(m.player1_id) !== userId && String(m.player2_id) !== userId) {
				return ;
			}
			// Check if current user is the winner or loser
			if (String(m.winner_id) ===  userId) {
				t.tourney_wins++;
			} else {
				t.tourney_losses++;
			}
		});

		//--------------------------Wrapper(stats) Section--------------------------	
			// 1) bar chart box that contains the top 5 highest match_wins
			const totalmatches_against_others = document.createElement("div");
			totalmatches_against_others.id = "total_tournaments_played";
			totalmatches_against_others.className = "flex flex-col w-90 h-64 justify-center items-center \
									bg-stone-400 p-6 outline outline-black/5 \
									dark:bg-slate-800 dark:shadow-none \
									dark:-outline-offset-1 dark:outline-white/10";
				//1.1) This will be a Bar Chart
				const barchartWrapper = document.createElement("div");
				barchartWrapper.className = "flex flex-col max-w-sm"
				const barWrapper = document.createElement("div");
				barWrapper.className = "w-76 h-32 relative";
				// Bar chart
				const barCanvas = document.createElement("canvas");
				barCanvas.id = "barChart";
				barCanvas.className = "flex flex-col w-50 p-1";
					//Total tournaments
					const tournamentSelect = document.createElement("select");
					tournamentSelect.className = "p-2 rounded bg-stone-300 dark:bg-slate-700 text-black dark:text-white"
					tournamentSelect.innerHTML = `<option value="" disabled selected hidden>Select a Tournament</option>`;
					// Details box (single container for info)
					const detailsBox = document.createElement("div");
					detailsBox.className =
					"mt-3 p-3 rounded bg-stone-200 dark:bg-slate-700 text-black dark:text-white hidden";

					// Populate dropdown
					for (const [id, t] of tournamentsMap) {
					const opt = document.createElement("option");
					opt.value = String(id);
					opt.textContent = `${t.name}`;
					tournamentSelect.appendChild(opt);
					}

					// Show details on selection
					tournamentSelect.addEventListener("change", () => {
						const selectedId = Number(tournamentSelect.value);
						if (!selectedId) {
							detailsBox.classList.add("hidden");
							return;
						}

						const t = tournamentsMap.get(selectedId);
						if (!t) return;

						detailsBox.classList.remove("hidden");
						//Ordered list (<ol>) – numbered list
						//Unordered list (<ul>) – bullet points
						detailsBox.innerHTML = `
							<p class="font-bold">${t.name}</p>
							<p>Wins: ${t.tourney_wins}</p>
							<p>Losses: ${t.tourney_losses}</p>
							<hr class="my-2"/>
							<ul class="list-disc pl-5">
							${matches.data
								.filter((m: CreateMatchBody) => Number(m.tournament_id) === selectedId)
								.map((m: CreateMatchBody) => {
								const p1 = m.player1_id === Number(userId) ? "\"You\"" : m.player1_alias;
								const p2 = m.player2_id === Number(userId) ? "\"You\"" : m.player2_alias;
								let result: string;
								if (m.player1_id === Number(userId) || m.player2_id === Number(userId)) {
									if (m.winner_id === Number(userId)) {
										result = "✅ Won";
									} else if (m.winner_id != null) {
										result = "❌ Lost"; // someone else won
									} else
										result = "Irrelvant";
								} else
									result = "Not Recorded";
								return `<li>${p1} vs ${p2} → ${result}</li>`;//li -> list item
								})
								.join("")}
							</ul>
						`;
					});
					// ---------------- Popup Modal ----------------
					const popupOverlay = document.createElement("div");
					popupOverlay.className =
					"fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center hidden z-50";
					popupOverlay.id = "tournament-popup";

					// Inner modal box
					const popupBox = document.createElement("div");
					popupBox.className =
					"bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 w-96 relative";
					popupBox.innerHTML = `
					<button id="closePopup" class="absolute top-2 right-2 text-gray-500 hover:text-black">✖</button>
					<h2 id="popupTitle" class="text-xl font-bold mb-4">Tournament Info</h2>
					<div id="popupContent" class="text-gray-700 dark:text-gray-200">
						<p>Select a tournament to view details.</p>
					</div>
					`;
					popupOverlay.appendChild(popupBox);
					container.appendChild(popupOverlay);

					//HandleDrop Down
					tournamentSelect.addEventListener("change", () => {
						const selectedId = Number(tournamentSelect.value);
						if (!selectedId) return;

						const t = tournamentsMap.get(selectedId);
						if (!t) return;

						const popupTitle = document.getElementById("popupTitle")!;
						const popupContent = document.getElementById("popupContent")!;

						popupTitle.textContent = `Tournament ${t.name}`;
						popupContent.innerHTML = `
							<p><strong>Wins:</strong> ${t.tourney_wins}</p>
							<p><strong>Losses:</strong> ${t.tourney_losses}</p>
							<hr class="my-2"/>
							<p class="font-bold">Match Details:</p>
							<ul class="list-disc pl-5">
							${matches.data
								.filter((m: CreateMatchBody) => Number(m.tournament_id) === selectedId)
								.map((m: CreateMatchBody) => {
									const p1 = m.player1_id === Number(userId) ? "[You]" : m.player1_alias;
									const p2 = m.player2_id === Number(userId) ? "[You]" : m.player2_alias;
									
									let result: string;
									if (m.player1_id === Number(userId) || m.player2_id === Number(userId)) {
										if (m.winner_id === Number(userId))
											result = "✅ Won";
										else
											result = "❌ Lost"; // someone else won
									} else
										result = "\"\"";
									return `<li>${p1} vs ${p2} → ${result}</li>`;
								})
								.join("")}
							</ul>
						`;
					// Show popup
						popupOverlay.classList.remove("hidden");
						tournamentSelect.value = "";
					});
					// Close popup
					document.getElementById("closePopup")!.addEventListener("click", () => {
						popupOverlay.classList.add("hidden");
					});
				barWrapper.appendChild(barCanvas);
				barchartWrapper.append(barWrapper, tournamentSelect);
				totalmatches_against_others.appendChild(barchartWrapper);
	
			// 2) This box contains the donut chart as well as the text for match_wins
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
				donutWrapper.className = "w-32 h-32 relative";
				const donutCanvas = document.createElement("canvas");
				donutCanvas.id = "donutChart";
				donutCanvas.className = "w-32 h-32 p-1";
				const scoreWrapper = document.createElement("div");
				scoreWrapper.className = "flex flex-col justify-center items-center"
				const scoreWins = document.createElement("p");
				scoreWins.className = "text-lg font-bold text-center text-gray-900/50 dark:text-white"
				scoreWins.textContent = "TOURNAMENT WINS:"
				const wins_percent = ((match_wins / match_inTotal) * 100).toFixed(2);
				const scoreWins_score = document.createElement("p");
				scoreWins_score.className = "text-2xl font-bold text-center text-white dark:text-white"
				scoreWins_score.textContent = `${wins_percent}` + "%";

				const gamescore_Wrapper = document.createElement("div");
				gamescore_Wrapper.className = "flex flex-col";
				const game_score_header = document.createElement("p");
				game_score_header.className = "place-content-center text-lg font-bold text-center text-gray-900/50 dark:text-white";
				game_score_header.textContent = "GAME SCORE:";
				let game_score = (match_wins * 10000) - (match_losses * 100);
				if (game_score < 0)
					game_score = 0;
				const game_score_text = document.createElement("p");
				game_score_text.className = "place-content-center text-2xl font-bold text-center text-white dark:text-white";
				game_score_text.textContent = `${game_score}`;
				gamescore_Wrapper.append(game_score_header, game_score_text);

				//picture shrug (for no data)
				const shrug = document.createElement("img");
				shrug.className = "w-24 h-24 rounded-full outline"
				fetch('../imgs/shrug.png', { method: "HEAD" })
					.then(badge_res => {
						if (badge_res.ok) {
							shrug.src = '../imgs/shrug.png';
						} else {
							console.warn("shurg image not found!");
						}
					})
					.catch(err => console.error("Error checking shurg image:", err));
				if (matches.data.length != 0)
					donutWrapper.appendChild(donutCanvas);
				else
					donutWrapper.appendChild(shrug);
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
				p_name.textContent = "User: " + user.name;
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
					match_played_wins.className = "place-content-center text-xl font-bold \
													text-center text-green-800 dark:text-white"
					match_played_wins.textContent = "Total Matches won: " + match_wins;
					const match_played_loss = document.createElement("p");
					match_played_loss.className = "place-content-center text-xl font-bold \
													text-center text-red-800 dark:text-white"
					match_played_loss.textContent = "Total Matches lost: " + match_losses;
					const totalMatches = document.createElement("p");
					totalMatches.className = "place-content-center text-2xl font-bold \
												text-center text-white dark:text-white";
					totalMatches.textContent = "Total Matches played: " + match_inTotal;
					const tips_img = document.createElement("img");
					fetch('../imgs/Bronze_badge.png', { method: "HEAD" })
						.then(badge_res => {
							if (badge_res.ok) {
								tips_img.src = '../imgs/joystick.png';
								tips_img.className = "w-24 h-24";
							} else {
								console.warn("joystick image not found!");
							}
						})
						.catch(err => console.error("Error checking joystick image:", err));
				wrap_played_text.append(match_played_wins, match_played_loss, totalMatches);
				wrap_played_and_img.append(tips_img, wrap_played_text);
				const tips = document.createElement("p");
				tips.className = "flex p-10";
				tips.textContent = "Tips: Damn you need to play more."
				if (matches.data.length == 0) {
					tips.textContent = "Tips: How about playing a game already NOOOOOOOOOOOB"
				}
				if (match_wins >= 5 && match_wins < 10) {
					tips.textContent = "Tips: Trying poking your opponent in real life beside you, distract them •ᴗ•"
				} else if (match_wins >= 10 && match_wins < 15) {
					tips.textContent = "Tips: Try joining a 42 school and learn how to hack, maybe you can win that way"
				} else if (match_wins > 15) {
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
				//Time to rank you based on how many match_wins
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
							console.warn("Newbie_Badge image not found!");
						}
					})
					.catch(err => console.error("Error checking Newbie_badge image:", err));

				if (match_wins >= 5 && match_wins < 10) {
					fetch('../imgs/Bronze_badge.png', { method: "HEAD" })
					.then(badge_res => {
						if (badge_res.ok) {
							player_rank_msg.textContent = "BRONZE RANK";
							player_rank_badge.src = '../imgs/Bronze_badge.png';
						} else {
							console.warn("Bronze_Badge image not found!");
						}
					})
					.catch(err => console.error("Error checking Bronze_badge image:", err));
				} else if (match_wins >= 10 && match_wins < 15) {
					fetch('../imgs/Bronze_badge.png', { method: "HEAD" })
					.then(badge_res => {
						if (badge_res.ok) {
							player_rank_msg.textContent = "SLIVER RANK";
							player_rank_badge.src = '../imgs/Sliver_badge.png';
						} else {
							console.warn("Sliver_Badge image not found!");
						}
					})
					.catch(err => console.error("Error checking Sliver_badge image:", err));
					player_rank_msg.textContent = "GOLD RANK";
					player_rank_badge.src = '../imgs/Gold_badge.png';
				} else if (match_wins > 15) {
					fetch('../imgs/Bronze_badge.png', { method: "HEAD" })
					.then(badge_res => {
						if (badge_res.ok) {
							player_rank_msg.textContent = "BRONZE RANK";
							player_rank_badge.src = '../imgs/Sliver_badge.png';
						} else {
							console.warn("Gold_Badge image not found!");
						}
					})
					.catch(err => console.error("Error checking Gold_badge image:", err));
					player_rank_msg.textContent = "GOLD RANK";
					player_rank_badge.src = '../imgs/Gold_badge.png';
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

		//3) Extract data from tournamentsMap into arrays->labels
		const tournamentLabels: string[] = [];
		const winsData: number[] = [];
		const lossesData: number[] = [];

		for (const [, t] of tournamentsMap) {
			tournamentLabels.push(t.name);
			winsData.push(t.tourney_wins);
			lossesData.push(t.tourney_losses);
		}

		//4) Make it show only the latest 5 matches:
		const MAX_TOURNEYS = 5;
		const tourneys = tournamentLabels.map((label, i) => ({
			label,
			match_wins: winsData[i],
			match_losses: lossesData[i],
		}));
		// sort by match_wins descending, then take the top MAX_TOP
		const topTourneys = tourneys
		.sort((a, b) => b.match_wins - a.match_wins)
		.slice(0, MAX_TOURNEYS);

		// extract back into arrays for Chart.js
		const topLabels = topTourneys.map(t => t.label);
		const topWins = topTourneys.map(t => t.match_wins);
		const topLosses = topTourneys.map(t => t.match_losses);

		// find max total (match_wins + match_losses) for suggestedMax
		const maxTotal = Math.max(...topTourneys.map(t => t.match_wins + t.match_losses));
		const suggestedMax = maxTotal + 1;

		//5) update with tournamentID (also why type line?)
		new Chart(barCanvas, {
		type: 'bar',
		options: {
				responsive: true,
				maintainAspectRatio: false,
				scales: {
					x: {
						stacked: true,
						max: suggestedMax,
					},
					y: {
						stacked: true,
						ticks: {
							autoSkip: false,
						}
					}
				},
				indexAxis: 'y',
			},
		data: {
			labels: topLabels.length > 0 ? topLabels : ["No tournaments yet"],
			datasets: [
			{
				label: "Wins",
				data: topLabels.length > 0 ? topWins : [0],
				backgroundColor: "#2bc933ff",
			},
			{
				label: "Losses",
				data: topLabels.length > 0 ? topLosses : [0],
				backgroundColor: "#fd0202ff",
			},
			],
		},
		});
		// Donut chart
		new Chart(donutCanvas, {
			type: "doughnut",
			options: {
				responsive: true,
				maintainAspectRatio: false,
			},
			data: {
				datasets: [
				{
					label: "Game Results",
					data: [match_wins, match_losses],
					backgroundColor: ["#2bc933ff", "#fd0202ff"], // green & red
				},
				],
			},
		});
	} catch (error: any) {
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
  const response = await fetch(`${API_BASE}/api/${endpoint}/${userId}`, {
	method: "GET",
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(`HTTP error! Status: ${response.status}`);
  }

  return response.json() as Promise<BackendUserResponse>;
}
