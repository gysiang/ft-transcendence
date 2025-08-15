import type { Player } from "../types";
import { runTournament } from "../Tournament/singleElim";
import { createGameCanvas } from "../Renderer";
import { startGame } from "../launch";
import { renderTournamentBracket } from "../matchUI";
import { createTournament } from "../Tournament/backendutils";
import { checkAuthentication } from "./auth";
import { api } from "./apiWrapper";

export function quickplayForm(app: HTMLElement): void
{
    app.innerHTML = `
        <div class = "max-w-md mx-auto mt-12 text-whitw space-y-6">
            <h2 class="text-3xl text-center"> Quickplay Setup </h2>
            <div>
                <label class="block mb-2"> Player 1 Alias </label>
                <input id ="player1" type ="text" class="w-full px-4 py-2 text-black rounded-md "/>
            </div>
            <div>
                <label class="block mb-2"> Player 2 Alias </label>
                <input id ="player2" type ="text" class="w-full px-4 py-2 text-black rounded-md"/>
            </div>
            <div class="flex items-center">
            <p class="mr-4 text-sm font-medium text-gray-900 dark:text-black"> Player 1 side</p>
            <label class="relative cursor-pointer">
            <input type="checkbox" class="sr-only peer" />
            <div class="w-[53px] h-7 flex items-center bg-gray-300 rounded-full text-[9px] peer-checked:text-[#007bff] text-gray-300 font-extrabold after:flex after:items-center after:justify-center peer after:content-['left'] peer-checked:after:content-['Right'] peer-checked:after:translate-x-full after:absolute after:left-[2px] peer-checked:after:border-white after:bg-white after:border after:border-gray-300 after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-[#007bff]">
            </div>
            </label>
            </div>
            <div>
                <label for="goalLimit" class="block mb-2"> Goals </label>
                <input id="goalLimit" type = "number" min="1" max="10" value="5" class="w-full px-4 py-2 text-black rounded-md" />
            
            <button id ="quickplayStart" class="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-md text-xl">
                Start
            </button>
        </div>
            `;
            setTimeout(() => {
                const button = document.getElementById("quickplayStart");
                button?.addEventListener("click", () => {
                    const sideToggle = document.querySelector("input[type='checkbox'].peer") as HTMLInputElement;
                    const players: { name: string; side: "left" | "right" }[] = [];
                    const name1 = (document.getElementById("player1") as HTMLInputElement).value || "Player 1";
                    const name2 = (document.getElementById("player2") as HTMLInputElement).value || "Player 2";
                    const side1: "left" | "right" = sideToggle?.checked ? "right" : "left";
                    const side2: "left" | "right" = side1 === "left" ? "right" : "left";
                    players.push({ name: name1, side: side1 });
                    players.push({ name: name2, side: side2 });
                    const goals = parseInt((document.getElementById("goalLimit") as HTMLInputElement).value, 10) || 5;
                    localStorage.setItem("players", JSON.stringify(players));
                    localStorage.setItem("goalLimit", goals.toString());
                    localStorage.setItem("mode", "quickplay");
                    app.innerHTML = ""; 
                    const { canvas, container } = createGameCanvas();
                    app.appendChild(container);
                    startGame(canvas);
                });
            }, 0);
}
export function tournamentForm(app: HTMLElement): void {
	app.innerHTML = `
		<div class="max-w-md mx-auto mt-12 text-black space-y-6">
			<h2 class="text-3xl text-center">Tournament Setup</h2>

			<div>
				<label class="block mb-2">Tournament Name</label>
				<input id="tournamentName" type="text" class="w-full px-4 py-2 text-black rounded-md" />
			</div>

			<div>
				<label class="block mb-2">Number of Players (2–8)</label>
				<input id="numPlayers" type="number" min="2" max="8" value="4" class="w-full px-4 py-2 text-black rounded-md" />
                <div id="playerCountAlert" class="text-red-600 text-sm mt-1 hidden">Number of players must be between 2 and 8.</div>

			</div>

			<div id="playerInputs" class="space-y-4"></div>

			<div>
				<label class="block mb-2">Goals to Win</label>
				<input id="goalLimit" type="number" min="1" max="20" value="5" class="w-full px-4 py-2 text-black rounded-md" />
			</div>

			<button id="startTournament" class="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-md text-xl">
				Start Tournament
			</button>
		</div>
	`;

	const playerCountInput = document.getElementById("numPlayers") as HTMLInputElement;
	const aliasContainer = document.getElementById("playerInputs")!;
	const startButton = document.getElementById("startTournament")!;

    function updateAliasFields() {
        const count = parseInt(playerCountInput.value, 10);
        const alert = document.getElementById("playerCountAlert")!;
    
        if (isNaN(count) || count < 2 || count > 8) {
            alert.classList.remove("hidden");
            aliasContainer.innerHTML = ""; 
            return;
        } else {
            alert.classList.add("hidden");
        }
    
        aliasContainer.innerHTML = "";
    
        for (let i = 0; i < count; i++) {
            const input = document.createElement("input");
            input.type = "text";
            input.placeholder = `Player ${i + 1}`;
            input.className = "w-full p-2 border border-gray-300 rounded text-black";
            input.dataset.index = i.toString();
            aliasContainer.appendChild(input);
        }
    }
    
	updateAliasFields();
	playerCountInput.addEventListener("input", updateAliasFields);

	startButton.addEventListener("click", () => {
		const aliasInputs = aliasContainer.querySelectorAll("input");
		const players: Player[] = [];

		aliasInputs.forEach((input, i) => {
			const name = input.value.trim() || `Player ${i + 1}`;
			players.push({ name, side: "left" }); 
		});

		const goalLimit = parseInt((document.getElementById("goalLimit") as HTMLInputElement).value, 10) || 5;
		handleStartTournament(app, players, goalLimit);
	});
}
type Profile = { id: number; name: string; email: string; profile_picture?: string };

export async function handleStartTournament(
  app: HTMLElement,
  players: Player[],
  goalLimit: number = 5
) {
  const rounds = runTournament(players);

  localStorage.setItem('mode', 'tournament');
  localStorage.setItem('goalLimit', String(goalLimit));
  localStorage.setItem(
    'tournamentData',
    JSON.stringify({ rounds, currentRoundIndex: 0, currentMatchIndex: 0 })
  );

  const authed = await checkAuthentication();

  let tournamentId: number | null = null;
  let localOnly = true;
  let createdBy = 'placeholder';

  if (authed) {
    const id = localStorage.getItem('currentUserId');
    if (id) {
      try {
        const prof = await api<Profile>(`http://localhost:3000/api/profile/${id}`, { method: 'GET' });
        if (prof?.name?.trim()) createdBy = prof.name.trim();
      } catch (e) {
        console.warn('Could not fetch profile for created_by:', e);
      }
    }

    try {
      const p1 = players[0]?.name ?? 'Player 1';
      const p2 = players[1]?.name ?? 'Player 2';
      tournamentId = await createTournament({
        player1_alias: p1,
        player2_alias: p2,
        created_by: createdBy,
      });
      localOnly = false;
    } catch (e) {
      console.log('Backend tournament create failed;', e);
    }
  } else {
    console.log('Not logged in. Local tournament only.');
  }

  localStorage.setItem(
    'tournamentSnapshot',
    JSON.stringify({
      id: tournamentId,
      localOnly,
      name:
        (document.getElementById('tournamentName') as HTMLInputElement)?.value?.trim() ||
        'Untitled Tournament',
      goalLimit,
      players,
      rounds,
      results: [],
      finished: false,
      createdAt: new Date().toISOString(),
    })
  );

  app.innerHTML = '';
  const { canvas, container } = createGameCanvas();
  app.appendChild(container);
  renderTournamentBracket(rounds);
  startGame(canvas);
}