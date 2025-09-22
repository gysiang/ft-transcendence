import { tournamentForm } from "../registration/registrationForm";
import { checkAuthentication } from "../registration/auth";
import { getLoggedInUserName } from "../registration/registrationForm";
import { renderTournamentScreen } from "../Tournament/TournamentLobby";
import { renderControlsBanner } from "./controls";

type Mode = "local" | "online";

export async function renderGameModes(mountInto: HTMLElement) {
  //history.pushState({ page: 'play' }, '', '/play');
  const root = document.createElement("section");
  root.className = "min-h-[70vh] px-6 py-10 bg-gray-100";

  root.innerHTML = `
    <div class="max-w-5xl mx-auto space-y-8">
      <header class="text-center space-y-2">
        <h1 class="text-3xl font-bold">Choose Game Mode</h1>
        <p class="text-gray-600">Start a local match or set up an online tournament.</p>
      </header>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div id="cardLocal"
             class="group relative rounded-2xl border bg-white p-6 text-left shadow-sm ring-1 ring-gray-200 transition">
          <button id="btnLocal" type="button" class="w-full text-left focus:outline-none" aria-expanded="false">
            <div class="flex items-center gap-4">
              <div>
                <h2 class="text-xl font-semibold">Local Tournament</h2>
                <p class="text-sm text-gray-600">Play on this device with friends.</p>
              </div>
              <div class="ml-auto text-gray-300 transition-transform group-[.active]:rotate-90">➤</div>
            </div>
          </button>
          <div id="panelLocal" class="overflow-hidden transition-all duration-300 max-h-0 opacity-0 scale-95">
            <div class="mt-6 rounded-xl border border-dashed border-gray-300 bg-white/70 p-4">
              <div class="text-gray-500 text-sm">Loading…</div>
            </div>
          </div>
        </div>

        <div id="cardOnline"
             class="group relative rounded-2xl border bg-white p-6 text-left shadow-sm ring-1 ring-gray-200 transition">
          <button id="btnOnline" type="button" class="w-full text-left focus:outline-none" aria-expanded="false">
            <div class="flex items-center gap-4">
              <div>
                <h2 class="text-xl font-semibold">Online Tournament</h2>
                <p class="text-sm text-gray-600">Matchmaking for logged-in players.</p>
              </div>
              <div class="ml-auto text-gray-300 transition-transform group-[.active]:rotate-90">➤</div>
            </div>
          </button>
          <div id="panelOnline" class="overflow-hidden transition-all duration-300 max-h-0 opacity-0 scale-95">
            <div class="mt-6 rounded-xl border border-dashed border-gray-300 bg-white/70 p-4">
              <div class="text-gray-500 text-sm">Loading…</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  //mountInto.replaceWith(root);
  mountInto.replaceChildren(root);
  renderControlsBanner(root, 'tournament', [
    { alias: 'Player 1', side: 'left'  as const },
    { alias: 'Player 2', side: 'right' as const },
  ]);
  

  const cardLocal   = root.querySelector<HTMLDivElement>("#cardLocal")!;
  const cardOnline  = root.querySelector<HTMLDivElement>("#cardOnline")!;
  const btnLocal    = root.querySelector<HTMLButtonElement>("#btnLocal")!;
  const btnOnline   = root.querySelector<HTMLButtonElement>("#btnOnline")!;
  const panelLocal  = root.querySelector<HTMLDivElement>("#panelLocal")!;
  const panelOnline = root.querySelector<HTMLDivElement>("#panelOnline")!;

  const ACTIVE_CARD   = ["active", "ring-2", "ring-indigo-500"];
  const INACTIVE_CARD = ["opacity-50", "grayscale"];
  const PANEL_VISIBLE = ["max-h-[2000px]", "opacity-100", "scale-100", "mt-4"];
  const PANEL_HIDDEN  = ["max-h-0", "opacity-0", "scale-95"];

  function resetVisuals() {
    [cardLocal, cardOnline].forEach(c => c.classList.remove(...ACTIVE_CARD, ...INACTIVE_CARD));
    [panelLocal, panelOnline].forEach(p => {
      p.classList.remove(...PANEL_VISIBLE);
      p.classList.add(...PANEL_HIDDEN);
      const body = p.querySelector("div > div") as HTMLDivElement | null;
      if (body) body.innerHTML = "";
    });
    btnLocal.setAttribute("aria-expanded", "false");
    btnOnline.setAttribute("aria-expanded", "false");
  }

  function setActive(mode: Mode) {
    resetVisuals();
    if (mode === "local") {
      cardLocal.classList.add(...ACTIVE_CARD);
      cardOnline.classList.add(...INACTIVE_CARD);
      panelLocal.classList.remove(...PANEL_HIDDEN);
      panelLocal.classList.add(...PANEL_VISIBLE);
      btnLocal.setAttribute("aria-expanded", "true");
    } else {
      cardOnline.classList.add(...ACTIVE_CARD);
      cardLocal.classList.add(...INACTIVE_CARD);
      panelOnline.classList.remove(...PANEL_HIDDEN);
      panelOnline.classList.add(...PANEL_VISIBLE);
      btnOnline.setAttribute("aria-expanded", "true");
    }
  }

  function panelBody(panel: HTMLDivElement): HTMLDivElement {
    return panel.querySelector("div > div") as HTMLDivElement;
  }

  ["click", "mousedown", "mouseup", "focusin"].forEach(ev => {
    panelLocal.addEventListener(ev, e => e.stopPropagation());
    panelOnline.addEventListener(ev, e => e.stopPropagation());
  });

  async function mountLocal() {
    setActive("local");
    const body = panelBody(panelLocal);
    renderControlsBanner(root, 'tournament', [
      { alias: 'Player 1', side: 'left'  },
      { alias: 'Player 2', side: 'right' },
    ]);
    tournamentForm(body);
    panelLocal.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function mountOnline() {
    renderControlsBanner(root, 'online', [
      { alias: 'You',     side: 'left'  }, 
      { alias: 'Opponent', side: 'right' },
    ]);
    setActive("online");
    const body = panelBody(panelOnline);

    const authed = await checkAuthentication().catch(() => false);
    if (!authed) {
      body.innerHTML = `
        <div class="flex flex-col items-center justify-center p-6 text-center">
          <p class="text-gray-700">You must be logged in to start an online tournament.</p>
          <a href="/login"
             class="mt-4 inline-flex items-center rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 transition">
            Go to Login
          </a>
        </div>
      `;
      return;
    }

    const alias = (await getLoggedInUserName().catch(() => "")) ?? "";
    renderTournamentScreen(body, { alias, lockAlias: true });
    panelOnline.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  resetVisuals();

  btnLocal.addEventListener("click", (e) => { e.stopPropagation(); void mountLocal(); });
  btnOnline.addEventListener("click", (e) => { e.stopPropagation(); void mountOnline(); });
  cardLocal.addEventListener("click", (e) => { if (!panelLocal.contains(e.target as Node)) btnLocal.click(); });
  cardOnline.addEventListener("click", (e) => { if (!panelOnline.contains(e.target as Node)) btnOnline.click(); });
}
