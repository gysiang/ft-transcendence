import type { Player } from "../types";
import { renderModes } from "../registration/modes.js";
import { tournamentForm, handleStartTournament } from "../registration/registrationForm";

type TournamentSnapshot = {
    id?: number | null;
    name: string;
    goalLimit: number;
    players: { alias?: string; name?: string; side?: "left" | "right" }[];
    rounds?: any[];
    results?: any[];
    finished?: boolean;
    createdAt?: string;
  };
  
  function getSnapshot(): TournamentSnapshot | null {
    try {
      return JSON.parse(localStorage.getItem("tournamentSnapshot") || "null");
    } catch {
      return null;
    }
  }
  function saveSnapshot(snap: TournamentSnapshot) {
    localStorage.setItem("tournamentSnapshot", JSON.stringify(snap));
  }
  function clearTournamentState() {
    localStorage.removeItem("tournamentData");
    localStorage.removeItem("mode");
  }
  
  function goHome(app: HTMLElement) {
    app.innerHTML = "";
    renderModes(app);
  }
  
  async function playAnotherRound(app: HTMLElement) {
    const snap = getSnapshot();
    if (!snap) return startNewTournament(app);
    const sameName = snap.name || "Local Tournament";
  
    const updatedSnap: TournamentSnapshot = {
      ...snap,
      id: null,               
      name: sameName,
      finished: false,
      results: [],
      rounds: [],             
    };
    saveSnapshot(updatedSnap);
  
    
    const players: Player[] = (updatedSnap.players || []).map((p, i) => ({
      name: p.alias ?? p.name ?? `Player ${i + 1}`,
      side: "left",
    }));
  
    localStorage.setItem("mode", "tournament");
    app.innerHTML = "";
    await handleStartTournament(app, players, updatedSnap.goalLimit ?? 5);
  }
  function startNewTournament(app: HTMLElement) {
    const snap = getSnapshot();
    const sameName = snap?.name || "";
  
    clearTournamentState();
    tournamentForm(app);
  
    queueMicrotask(() => {
      const input = document.getElementById("tournamentName") as HTMLInputElement | null;
      if (input) input.value = sameName;
    });
  }
  
  export function renderTournamentVictoryScreen(app: HTMLElement, winnerAlias: string) {
    const snap = getSnapshot();
    if (snap && !snap.finished) {
      saveSnapshot({ ...snap, finished: true });
    }
  
    const tourName = snap?.name || "Local Tournament";
    const playersCount = snap?.players?.length ?? 0;
    const goalLimit = snap?.goalLimit ?? 5;
  
    app.innerHTML = `
      <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
        <div role="dialog" aria-modal="true"
             class="w-full max-w-xl rounded-2xl bg-white shadow-2xl ring-1 ring-black/5 p-8 text-center animate-[fadeIn_200ms_ease-out]">
          <div class="mx-auto w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
            <span class="text-3xl">🏆</span>
          </div>
  
          <h1 class="text-3xl font-bold tracking-tight">Tournament Champion</h1>
          <p class="mt-2 text-lg text-gray-700">
            Congratulations, <span class="font-semibold">${winnerAlias}</span>!
          </p>
  
          <div class="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm text-gray-700">
            <div class="rounded-lg bg-gray-50 p-3">
              <div class="font-medium text-gray-800">Tournament</div>
              <div class="truncate">${tourName}</div>
            </div>
            <div class="rounded-lg bg-gray-50 p-3">
              <div class="font-medium text-gray-800">Players</div>
              <div>${playersCount}</div>
            </div>
            <div class="rounded-lg bg-gray-50 p-3">
              <div class="font-medium text-gray-800">Goal Limit</div>
              <div>${goalLimit}</div>
            </div>
          </div>
  
          <div class="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button id="btnHome"
              class="inline-flex items-center justify-center rounded-xl  px-4 py-3
              text-white bg-indigo-600 hover:bg-indigo-700 active:translate-y-px transition">
              Home
            </button>
  
            <button id="btnRematch"
              class="inline-flex items-center justify-center rounded-xl px-4 py-3
                     text-white bg-indigo-600 hover:bg-indigo-700 active:translate-y-px transition">
              Play another round
            </button>
  
            <button id="btnNew"
              class="inline-flex items-center justify-center rounded-xl px-4 py-3
                     text-white bg-indigo-600 hover:bg-indigo-700 active:translate-y-px transition">
              Start new tournament
            </button>
          </div>
  
          <button id="btnClose" class="mt-6 text-xs text-gray-500 hover:text-gray-700 underline">
            Close
          </button>
        </div>
      </div>
    `;
  

    document.getElementById("btnHome")!.addEventListener("click", () => {
      clearTournamentState();
      goHome(app);
    });
    document.getElementById("btnRematch")!.addEventListener("click", () => {
      playAnotherRound(app);
    });
    document.getElementById("btnNew")!.addEventListener("click", () => {
      startNewTournament(app);
    });
    document.getElementById("btnClose")!.addEventListener("click", () => {
      (document.querySelector(".fixed.inset-0.z-50") as HTMLElement)?.remove();
    });
  }