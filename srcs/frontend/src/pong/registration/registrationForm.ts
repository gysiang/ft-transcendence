import type { Player } from "../types";
import { runTournament } from "../Tournament/singleElim";
import { createGameCanvas } from "../Renderer";
import { startGame } from "../launch";
import { renderTournamentBracket } from "../matchUI";
import { createTournament } from "../Tournament/backendutils";
import { checkAuthentication } from "./auth";
import { validAlias,validGoal,setFieldError } from "./InputValidation";
import { API_BASE } from "../../variable"

export async function getLoggedInUserName(): Promise<string | null> {
  try {
    const res = await fetch(`${API_BASE}/api/me`, {
      credentials: 'include',
      cache: 'no-store',
    });
    if (res.status !== 200) return null;
    const { name } = await res.json();
    const trimmed = String(name || '').trim();
    return trimmed || null;
  } catch {
    return null;
  }
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
        <input id="goalLimit" type="number" min="1" max="10" value="5" class="w-full px-4 py-2 text-black rounded-md" />
        <div id="goalError" class="text-red-600 text-sm mt-1"></div>
      </div>

      <div id="formError" class="text-red-700 text-sm"></div>

      <button id="startTournament" class="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-md text-xl">
        Start Tournament
      </button>
    </div>
  `;

  const playerCountInput = document.getElementById("numPlayers") as HTMLInputElement;
  const aliasContainer = document.getElementById("playerInputs")!;
  const startButton = document.getElementById("startTournament")!;
  const formError = document.getElementById("formError")!;
  const goalInput = document.getElementById("goalLimit") as HTMLInputElement;
  const goalError = document.getElementById("goalError")!;
  const nameInput = document.getElementById("tournamentName") as HTMLInputElement;

  let userAlias: string | null = null;

  function updateAliasFields(currentUserAlias?: string | null) {
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
      input.maxLength = 32;
      input.required = true;

      if (i === 0 && currentUserAlias) {
        input.value = currentUserAlias;
        input.readOnly = true;
        input.classList.add("bg-gray-100", "cursor-not-allowed");
      }

      input.addEventListener("input", () => {
        const msg = validAlias(input.value || "");
        setFieldError(input, msg);
      });

      aliasContainer.appendChild(input);
      setFieldError(input, null);
    }
  }

  updateAliasFields();

  (async () => {
    try {
      userAlias = await getLoggedInUserName();
    } catch { userAlias = null; }
    updateAliasFields(userAlias);
    playerCountInput.addEventListener("input", () => updateAliasFields(userAlias || undefined));
  })();

  goalInput.addEventListener("input", () => {
    const n = parseInt(goalInput.value, 10);
    const err = validGoal(Number.isNaN(n) ? 0 : n);
    goalError.textContent = err || "";
    goalInput.classList.toggle("border-red-500", !!err);
  });

  startButton.addEventListener("click", async () => {
    history.pushState({ page: "local_started" }, "", "/play/local");
    formError.textContent = "";

    const aliasInputs = Array.from(aliasContainer.querySelectorAll("input")) as HTMLInputElement[];
    const players: Player[] = [];

    let firstInvalid: HTMLInputElement | null = null;
    for (const input of aliasInputs) {
      const msg = validAlias(input.value || "");
      setFieldError(input, msg);
      if (msg && !firstInvalid) firstInvalid = input;
    }

    const names = aliasInputs.map(i => i.value.trim().toLowerCase());
    const dupMap = new Map<string, number>();
    names.forEach(n => dupMap.set(n, (dupMap.get(n) || 0) + 1));
    const duplicates = names.filter(n => dupMap.get(n)! > 1);
    if (duplicates.length) {
      formError.textContent = "Aliases must be unique.";
      if (!firstInvalid) firstInvalid = aliasInputs[names.indexOf(duplicates[0])];
    }

    const goal = parseInt(goalInput.value, 10);
    const goalMsg = validGoal(Number.isNaN(goal) ? 0 : goal);
    goalError.textContent = goalMsg || "";
    if (goalMsg && !firstInvalid) firstInvalid = goalInput as any;

    if (firstInvalid) {
      firstInvalid.focus();
      return;
    }

    aliasInputs.forEach((input, i) => {
      const name = (input.value.trim() || `Player ${i + 1}`);
      players.push({ name, side: "left" });
    });

    await handleStartTournament(app, players, goal);
  });
}
export async function handleStartTournament(
  _app: HTMLElement,
  players: Player[],
  goalLimit: number = 5,

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

  const rawName =
    (document.getElementById('tournamentName') as HTMLInputElement | null)?.value ?? '';
  const trimmed = rawName.trim();
  const fallback = 'Untitled Tournament';
  const tournamentName: string = trimmed || fallback;

  if (authed) {
    try {
      tournamentId = await createTournament({ name: tournamentName });
      localOnly = false;
    } catch (e) {
      console.log('Backend tournament create failed;', e);
    }
  } else {
    //console.log('Not logged in. Local tournament only.');
  }

  localStorage.setItem(
    'tournamentSnapshot',
    JSON.stringify({
      id: tournamentId,
      localOnly,
      name: tournamentName,
      goalLimit,
      players,
      rounds,
      results: [],
      finished: false,
      createdAt: new Date().toISOString(),
    })
  );
  const mount = document.getElementById('app') as HTMLElement;

  mount.innerHTML = '';
  const { canvas, container } = createGameCanvas();
  mount.appendChild(container);
  renderTournamentBracket(rounds);
  startGame(canvas);
}
