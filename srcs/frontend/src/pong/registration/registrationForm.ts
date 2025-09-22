import type { Player } from "../types";
import { runTournament } from "../Tournament/singleElim";
import { createGameCanvas } from "../Renderer";
import { startGame } from "../launch";
import { renderTournamentBracket } from "../matchUI";
import { createTournament } from "../Tournament/backendutils";
import { checkAuthentication } from "./auth";
import { api } from "./apiWrapper";
import { validAlias,validGoal,setFieldError } from "./InputValidation";
import { API_BASE } from "../../variable"
/*
export async function getLoggedInUserName({ fresh = false }: { fresh?: boolean } = {}): Promise<string | null> {
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
}*/
export async function getLoggedInUserName(
  { fresh = false }: { fresh?: boolean } = {}
): Promise<string | null> {
  try {
    const url = fresh
      ? `${API_BASE}/api/me?ts=${Date.now()}`
      : `${API_BASE}/api/me`;

    const res = await fetch(url, {
      credentials: 'include',
      cache: 'no-store',                   // bypass browser HTTP cache
      headers: { 'Cache-Control': 'no-cache' }, // nudge proxies/SW to revalidate
    });

    if (!res.ok) return null;

    // Accept either { alias, name } shapes
    const data = await res.json();
    const raw = (data?.name ?? '').toString().trim();
    return raw || null;
  } catch {
    return null;
  }
}
/*
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
            <button id="quickmatchOnline" class="mt-3 w-full bg-sky-600 hover:bg-sky-700 text-white py-3 rounded-md text-xl">
            Online Quickmatch
            </button>
        </div>
            `;
            let userAlias: string | null = null;
            (async () => {
              userAlias = await getLoggedInUserName();
              if (userAlias)
                {
                const p1 = document.getElementById("player1") as HTMLInputElement | null;
                if (p1)
                  {
                    p1.value = userAlias;
                    p1.readOnly = true;
                    p1.classList.add('bg-gray-100', 'cursor-not-allowed');
                  }
              }})();

            setTimeout(() => {
                const button = document.getElementById("quickplayStart");
                button?.addEventListener("click", () => {
                    const sideToggle = document.querySelector("input[type='checkbox'].peer") as HTMLInputElement;
                    const players: { name: string; side: "left" | "right" }[] = [];
                    const name1_Input = (document.getElementById("player1") as HTMLInputElement).value || "Player 1";
                    const name1 = userAlias ?? name1_Input;
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
            /*
            const onlineBtn = document.getElementById("quickmatchOnline");
onlineBtn?.addEventListener("click", () => {
  const goals = parseInt((document.getElementById("goalLimit") as HTMLInputElement).value, 10) || 5;

  // Persist only what online mode needs
  localStorage.setItem("goalLimit", goals.toString());
  localStorage.setItem("mode", "online");

  // Clear page, mount canvas, and hand off to startGame
  app.innerHTML = "";
  const { canvas, container } = createGameCanvas();
  app.appendChild(container);
  startGame(canvas);
});
}*/
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
      userAlias = await getLoggedInUserName({ fresh: true });
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
    console.log('Not logged in. Local tournament only.');
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
  /*
  app.innerHTML = '';
  const { canvas, container } = createGameCanvas();
  app.appendChild(container);*/
  const mount = document.getElementById('app') as HTMLElement;

  mount.innerHTML = '';
  const { canvas, container } = createGameCanvas();
  mount.appendChild(container);
  renderTournamentBracket(rounds);
  startGame(canvas);
}
