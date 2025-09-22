
import { openTourneySocket } from './onlineClient.ts';
import { Game } from '../Pong.ts';
import { lockCanvasWorld, unlockCanvas } from '../Renderer.ts';
import { renderTournamentBracket, adaptTRoundsToLocal } from '../matchUI.ts';
import {extractTournamentNameFromState,showOnlineVictoryOverlay } from '../ui/onlinevictory.ts';
import {mountMatchAnnouncer,showMatchAnnouncement} from '../ui/matchAnnouncer.ts';

enum TLState{
  Idle = 'Idle',
  Lobby = 'Lobby',
  MatchAnnounce = 'MatchAnnounce',
  MatchPlaying = 'MatchPlaying',
  MatchEnded = 'MatchEnded',
  Finished = 'Finished',
}
const TL = {
  st: TLState.Idle,
  ac: new AbortController(),          
  // DOM
  root: null as HTMLElement | null,
  gameWrap: null as HTMLDivElement | null,
  gameContainer: null as HTMLDivElement | null,
  gameCanvas: null as HTMLCanvasElement | null,
  lobby: null as HTMLDivElement | null,
  playersDiv: null as HTMLDivElement | null,
  bracketWrap: null as HTMLDivElement | null,
  lobbyCode: null as HTMLDivElement | null,
  lobbyCodeTxt: null as HTMLSpanElement | null,
  btnReady: null as HTMLButtonElement | null,
  btnStart: null as HTMLButtonElement | null,
  formsWrap: null as HTMLDivElement | null,

  // runtime
  meReady: false,
  myPid: null as string | null,
  isHostLocal: false,
  sock: null as ReturnType<typeof openTourneySocket> | null,
  game: null as any,
  worldW: 800,
  worldH: 600,
  lastLobby: null as any,
  myAlias: '' as string,
  allowRender: false,
  renderGate: false,
  unmuteKeys: null as null | (() => void),
  pendingLobbyCode: null as string | null,
  ro: null as ResizeObserver | null,

  // announcer
  announcerReadyResolve: null as null | (() => void),
  announcerReady: Promise.resolve() as Promise<void>,
};

function setState(next: TLState) { TL.st = next; }
function teardown() {
  TL.ac.abort();                 
  TL.ac = new AbortController(); 
  try { TL.ro?.disconnect(); } catch {}
  TL.ro = null;
}
export type LobbyOpts = { alias?: string; lockAlias?: boolean };


function resetAnnouncerLatch() {
  TL.announcerReady = new Promise<void>((res) => { TL.announcerReadyResolve = res; });
}
function releaseAnnouncerLatch() {
  TL.announcerReadyResolve?.();
  TL.announcerReadyResolve = null;
}

function getOrCreateErrorEl(id: string, afterEl: HTMLElement): HTMLDivElement {
  let el = document.getElementById(id) as HTMLDivElement | null;
  if (!el) {
    el = document.createElement('div');
    el.id = id;
    el.className = "mt-2 text-sm text-red-600 hidden";
    afterEl.insertAdjacentElement('afterend', el);
  }
  return el;
}
export function renderTournamentScreen(root: HTMLElement, opts: LobbyOpts = {}) {
  teardown();
  const aliasFromCaller = String(opts.alias ?? "").trim();

  const cls = {
    wrap: "max-w-5xl mx-auto p-4 sm:p-6 text-slate-900",
    title: "text-3xl font-semibold tracking-tight text-center",
    card: "p-5 sm:p-6 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-4",
    label: "text-sm font-medium text-slate-700",
    input:
      "w-full mt-1 rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder-slate-400 shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white read-only:bg-white read-only:border-slate-200 read-only:cursor-default",
    number:
      "w-full mt-1 rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder-slate-400 shadow-sm outline-none appearance-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white",
    btnBase:
      "inline-flex items-center justify-center rounded-xl px-4 py-2.5 font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none",
    btnPrimary: "bg-blue-600 text-white hover:bg-blue-700",
    codeChip:
      "inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700",
    sectionTitle: "text-base font-semibold",
    subtle: "text-sm text-slate-600",
  };
  root.innerHTML = `
    <div class="${cls.wrap}">
    
      <h2 class="${cls.title}">Online Tournament</h2>

      <div class="grid gap-6 md:grid-cols-3 mt-6">
        <div class="md:col-span-2">
          <div id="gameWrap" class="hidden">
            <div id="gameContainer" class="relative w-full h-[60vh] min-h-[360px] border border-slate-200 rounded-none overflow-hidden bg-white">
              <canvas id="gameCanvas" class="absolute inset-0 w-full h-full block"></canvas>
            </div>
          </div>
        </div>

        <div id="lobby" class="${cls.card} hidden max-h-[60vh] overflow-auto">
          <div class="sticky top-0 bg-white">
            <div class="flex items-center justify-between gap-3 pb-2">
              <h3 class="${cls.sectionTitle}">Lobby</h3>
              <div class="flex items-center gap-2">
                <button id="btnReady" class="${cls.btnBase} ${cls.btnPrimary} px-3">Ready</button>
                <button id="btnStart" class="${cls.btnBase} ${cls.btnPrimary} hidden px-3" tabindex="-1">Start</button>
              </div>
            </div>
            <div id="lobbyCode" class="${cls.codeChip} hidden mt-1 w-max">
              <span id="lobbyCodeTxt">—</span>
            </div>
          </div>

          <div id="players" class="text-sm grid gap-1 mt-3"></div>
          <div id="bracketWrap" class="mt-3"></div>
        </div>
      </div>
      <div id="formsWrap" class="grid gap-6 md:grid-cols-2 mt-6">
        <div class="${cls.card}">
          <h3 class="${cls.sectionTitle}">Host</h3>
          <div>
            <label for="hostName" class="${cls.label}">Tournament name</label>
            <input id="hostName" class="${cls.input}" placeholder="Tournament name" value="Tournament" />
          </div>
          <div>
            <label for="hostAlias" class="${cls.label}">Your alias</label>
            <input id="hostAlias" class="${cls.input}" placeholder="Your alias" value="${aliasFromCaller || "Host"}" ${opts.lockAlias ? "readonly" : ""} />
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label for="hostGoal" class="${cls.label}">Goal limit</label>
              <input id="hostGoal" class="${cls.number}" type="number" min="1" max="10" value="5" />
              <p class="${cls.subtle}">1–10</p>
            </div>
            <div>
              <label for="hostMax" class="${cls.label}">Max players</label>
              <input id="hostMax" class="${cls.number}" type="number" min="2" max="8" value="8" />
              <p class="${cls.subtle}">2–8</p>
            </div>
          </div>
          <button id="btnHost" class="${cls.btnBase} ${cls.btnPrimary} w-full">Create</button>
        </div>

        <div class="${cls.card}">
          <h3 class="${cls.sectionTitle}">Join</h3>
          <div>
            <label for="joinCodeInput" class="${cls.label}">Join code</label>
            <input id="joinCodeInput" class="${cls.input}" placeholder="ABCD" />
          </div>
          <div>
            <label for="joinAlias" class="${cls.label}">Your alias</label>
            <input id="joinAlias" class="${cls.input}" placeholder="Your alias" value="${aliasFromCaller || "Player"}" ${opts.lockAlias ? "readonly" : ""} />
          </div>
          <button id="btnJoin" class="${cls.btnBase} ${cls.btnPrimary} w-full">Join</button>
        </div>
      </div>
    </div>
  `;
  mountMatchAnnouncer(document.body);
  const el = <T extends HTMLElement>(id: string, scope: ParentNode = root) =>
    scope.querySelector<T>(`#${id}`)!;

  const btnHost = el<HTMLButtonElement>("btnHost");
  const btnJoin = el<HTMLButtonElement>("btnJoin");
  TL.btnReady      = el<HTMLButtonElement>("btnReady");
  TL.btnStart      = el<HTMLButtonElement>("btnStart");
  TL.lobbyCode     = el<HTMLDivElement>("lobbyCode");
  TL.lobbyCodeTxt  = el<HTMLSpanElement>("lobbyCodeTxt");
  TL.lobby         = el<HTMLDivElement>("lobby");
  TL.playersDiv    = el<HTMLDivElement>("players");
  TL.bracketWrap   = el<HTMLDivElement>("bracketWrap");
  TL.gameWrap      = el<HTMLDivElement>("gameWrap");
  TL.gameContainer = el<HTMLDivElement>("gameContainer");
  TL.gameCanvas    = el<HTMLCanvasElement>("gameCanvas");
  TL.formsWrap     = el<HTMLDivElement>("formsWrap");
  TL.myAlias       = aliasFromCaller;
  TL.btnReady!.onclick = onReadyClick;
  TL.btnStart!.onclick = onStartClick;
  try { TL.ro?.disconnect(); } catch {}
TL.ro = new ResizeObserver(() => relockWorld());
if (TL.gameContainer) TL.ro.observe(TL.gameContainer);

window.addEventListener("resize", relockWorld, { signal: TL.ac.signal });
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) relockWorld();
}, { signal: TL.ac.signal });

 
function muteMatchKeys() {
  const handler = (e: KeyboardEvent) => {
    const k = e.key;
    if (k === 'ArrowUp' || k === 'ArrowDown' || k === 'w' || k === 'W' || k === 's' || k === 'S') {
      e.preventDefault();
      e.stopImmediatePropagation();
      e.stopPropagation();
      return false as any;
    }
  };
  window.addEventListener('keydown', handler, { capture: true });
  window.addEventListener('keyup',   handler, { capture: true });
  return () => {
    window.removeEventListener('keydown', handler as any, { capture: true } as any);
    window.removeEventListener('keyup',   handler as any, { capture: true } as any);
  };
}

function clearCanvasFrame() {
  try { unlockCanvas(TL.gameCanvas!); } catch {}
  const ctx = TL.gameCanvas!.getContext('2d');
  ctx?.setTransform(1, 0, 0, 1, 0, 0);
  ctx?.clearRect(0, 0, TL.gameCanvas!.width, TL.gameCanvas!.height);
}


function updateLobbyCodeDisplay() {
  const code = String((TL.lastLobby?.code ?? TL.pendingLobbyCode ?? "")).trim();
  if (!code) return;
  try {
    TL.lobbyCode!.classList.remove("hidden");
    TL.lobbyCodeTxt!.textContent = code;
  } catch {}
}
  function setReadyBtn() {
    TL.btnReady!.textContent = TL.meReady ? "Unready" : "Ready";
    TL.btnReady!.classList.toggle("bg-blue-600", !TL.meReady);
    TL.btnReady!.classList.toggle("hover:bg-blue-700", !TL.meReady);
    TL.btnReady!.classList.toggle("bg-blue-800", TL.meReady);
    TL.btnReady!.classList.toggle("hover:bg-blue-900", TL.meReady);
  }

  function revealGameArea() {
    TL.gameWrap!.classList.remove("hidden");
    TL.lobby!.classList.remove("hidden");
    TL.formsWrap?.classList.add("opacity-40", "pointer-events-none");
  }

  function relockWorld() {
    try {
      unlockCanvas(TL.gameCanvas!);
    } catch {}
    try {
      lockCanvasWorld(TL.gameCanvas!, TL.worldW, TL.worldH);
    } catch {}
  }
  function setStartVisibility(s: any) {
    const hostId = s?.host;
    const iAmHost = !!(hostId && TL.myPid && hostId === TL.myPid);
    const canStart = iAmHost && !s?.started && !s?.finished;
  
    if (canStart) {
      TL.btnStart!.classList.remove("hidden");
      TL.btnStart!.disabled = false;
    } else {
      TL.btnStart!.classList.add("hidden");
      TL.btnStart!.disabled = true;
    }
  }
  

  function isGameState(m: any): m is {
    ball: { x: number; y: number; r?: number };
    left: any;
    right: any;
  } {
    return !!(m && m.ball && typeof m.ball.x === "number" && typeof m.ball.y === "number");
  }

  function mountNewPage() {
    teardown();
    history.pushState({}, "", "/online");
    
    const app = document.getElementById("app") as HTMLElement;
    app.innerHTML = `
      <div class="${cls.wrap}">
        <h2 class="${cls.title}">Online Tournament</h2>

        <div class="grid gap-6 md:grid-cols-3 mt-6">
          <div class="md:col-span-2">
            <div id="gameWrap">
              <div id="gameContainer" class="relative w-full h-[70vh] min-h-[420px] border border-slate-200 rounded-none overflow-hidden bg-white">
                <canvas id="gameCanvas" class="absolute inset-0 w-full h-full block"></canvas>
              </div>
            </div>
          </div>

          <div id="lobby" class="${cls.card} max-h-[70vh] overflow-auto">
            <div class="sticky top-0 bg-white">
              <div class="flex items-center justify-between gap-3 pb-2">
                <h3 class="${cls.sectionTitle}">Lobby</h3>
                <div class="flex items-center gap-2">
                  <button id="btnReady" class="${cls.btnBase} ${cls.btnPrimary} px-3">Ready</button>
                  <button id="btnStart" class="${cls.btnBase} ${cls.btnPrimary} hidden px-3" tabindex="-1">Start</button>
                </div>
              </div>
              <div id="lobbyCode" class="${cls.codeChip} hidden mt-1 w-max">
                <span id="lobbyCodeTxt">—</span>
              </div>
            </div>

            <div id="players" class="text-sm grid gap-1 mt-3"></div>
            <div id="bracketWrap" class="mt-3"></div>
          </div>
        </div>
      </div>
    `;
    mountMatchAnnouncer(app);
    TL.gameWrap      = el<HTMLDivElement>("gameWrap", app);
    TL.gameContainer = el<HTMLDivElement>("gameContainer", app);
    TL.gameCanvas    = el<HTMLCanvasElement>("gameCanvas", app);
    TL.lobby         = el<HTMLDivElement>("lobby", app);
    TL.playersDiv    = el<HTMLDivElement>("players", app);
    TL.bracketWrap   = el<HTMLDivElement>("bracketWrap", app);
    TL.lobbyCode     = el<HTMLDivElement>("lobbyCode", app);
    TL.lobbyCodeTxt  = el<HTMLSpanElement>("lobbyCodeTxt", app);
    TL.btnReady      = el<HTMLButtonElement>("btnReady", app);
    TL.btnStart      = el<HTMLButtonElement>("btnStart", app);

    TL.formsWrap     = null as any;
    updateLobbyCodeDisplay();
    TL.btnReady!.onclick = onReadyClick;
    TL.btnStart!.onclick = onStartClick;
    try { TL.ro?.disconnect(); } catch {}
    TL.ro = new ResizeObserver(() => relockWorld());
    if (TL.gameContainer) TL.ro.observe(TL.gameContainer);

    window.addEventListener("resize", relockWorld, { signal: TL.ac.signal });
    document.addEventListener("visibilitychange", () => {
    if (!document.hidden) relockWorld();
    }, { signal: TL.ac.signal });


    setReadyBtn();
    revealGameArea();
  }

  function ensureSocket() {
    if (TL.sock) return TL.sock;

    
      const gh = {
        onStart: async (msg: any) => {
          await TL.announcerReady;
        
          if (msg.world && typeof msg.world.w === "number" && typeof msg.world.h === "number") {
            TL.worldW = msg.world.w; TL.worldH = msg.world.h;
          } else {
            TL.worldW = 800; TL.worldH = 600;
          }
          relockWorld();
        
          const { left, right } = currentMatchNamesFromLobby();
          const ctx = TL.gameCanvas!.getContext("2d")!;
          const players = [
            { name: left,  side: "left"  as const },
            { name: right, side: "right" as const },
          ];
        
          TL.game = new Game(TL.gameCanvas!, ctx, players, msg.goalLimit);
          TL.game.enableNetMode();
        
          requestAnimationFrame(relockWorld);
          setTimeout(relockWorld, 0);
          setState(TLState.MatchPlaying);
        },
        onState: (msg: any) => {
          if (!isGameState(msg)) return;
          if (!TL.renderGate) return;                 
      
          TL.game?.applyNetState({
            ball: { x: msg.ball.x, y: msg.ball.y, r: (msg as any).ball?.r ?? 8 },
            left: msg.left,
            right: msg.right,
          });
        },
      
        onMatchEnd: () => {
          TL.game = null;
          try { unlockCanvas(TL.gameCanvas!); } catch {}
          if (TL.unmuteKeys) { TL.unmuteKeys(); TL.unmuteKeys = null; }
          const ctx = TL.gameCanvas!.getContext("2d");
          ctx?.setTransform(1, 0, 0, 1, 0, 0);
          ctx?.clearRect(0, 0, TL.gameCanvas!.width, TL.gameCanvas!.height);
          TL.gameWrap!.classList.add("hidden");
          TL.formsWrap?.classList.remove("opacity-40", "pointer-events-none");
        },
      
        onTournamentEnd: (m: any) => {
          TL.game = null;
          try { unlockCanvas(TL.gameCanvas!); } catch {}
          const ctx = TL.gameCanvas!.getContext("2d");
          ctx?.setTransform(1, 0, 0, 1, 0, 0);
          ctx?.clearRect(0, 0, TL.gameCanvas!.width, TL.gameCanvas!.height);
          TL.gameWrap!.classList.add("hidden");
          TL.formsWrap?.classList.remove("opacity-40", "pointer-events-none");
      
          const winner = (m?.winner_name && String(m.winner_name).trim()) || "Champion";
          const tName  = extractTournamentNameFromState(TL.lastLobby || {}, "Tournament");
          showOnlineVictoryOverlay({
            winnerName: winner,
            tournamentName: tName,
            onHome: () => { window.location.href = "/"; },
            onNewTournament: () => { window.location.href = "/play"; },
          });
        },
      };

            const rawSubs: Array<(m:any)=>void> = [];
            function subscribeRaw(fn: (m:any)=>void) {
              rawSubs.push(fn);
              return () => {
                const i = rawSubs.indexOf(fn);
                if (i >= 0) rawSubs.splice(i, 1);
              };
            }
            function waitForMessages<T extends string>(
              wantedTypes: T[],
              { timeoutMs = 8000 }: { timeoutMs?: number } = {}
            ): Promise<any> {
              return new Promise((resolve, reject) => {
                const off = subscribeRaw((msg) => {
                  if (!msg || typeof msg.type !== "string") return;
                  if (msg.type === "t.error") {
                    cleanup();
                    reject(new Error(String(msg.msg || "Request failed")));
                    return;
                  }
                  if (wantedTypes.includes(msg.type as T)) {
                    cleanup();
                    resolve(msg);
                  }
                });
                const to = setTimeout(() => {
                  cleanup();
                  reject(new Error("Request timed out"));
                }, timeoutMs);
                function cleanup() { clearTimeout(to); off(); }
              });
            }
            let lastMatchStart: { p1?: string; p2?: string } | null = null;
    TL.sock = openTourneySocket(
      {
        
        onState: (s: any) => {
          rawSubs.forEach(fn => fn({ type: 't.state', ...s }));
          TL.lastLobby = s;
        
          const hostId = s.host as string | undefined;
        
          TL.isHostLocal = !!(hostId && TL.myPid && TL.myPid === hostId);
          setStartVisibility(s);
          TL.lobby!.classList.remove("hidden");
        
          const code = s.code;
          if (code && TL.lobbyCode) {
            TL.pendingLobbyCode = String(code);
            TL.lobbyCode.classList.remove("hidden");
            TL.lobbyCodeTxt!.textContent = String(code);
          }
        
          const arr = Array.isArray(s.players) ? s.players : [];
          TL.playersDiv!.innerHTML = arr.map((p: any) => {
            const isHost = hostId && p.id === hostId;
            const badge = isHost
              ? `<span class="ml-2 inline-flex items-center rounded bg-indigo-100 px-2 py-0.5 text-[10px] font-medium text-indigo-700">Host</span>`
              : "";
            return `
              <div class="flex items-center justify-between rounded-lg px-3 py-2 bg-slate-50">
                <span>• ${String(p?.name ?? "Player")}${badge}</span>
                <span class="text-xs ${p.ready ? "text-emerald-600" : "text-amber-600"}">
                  ${p.ready ? "Ready" : "Waiting"}
                </span>
              </div>`;
          }).join("");
        
          TL.bracketWrap!.innerHTML = '<div id="bracket" class="space-y-4 text-sm"></div>';
          const localRounds = adaptTRoundsToLocal(s.rounds ?? [], arr);
          renderTournamentBracket(localRounds);
        
          setStartVisibility(s);
        
          if (s?.finished) {
            const idToName: Record<string,string> = {};
            for (const p of (Array.isArray(s.players) ? s.players : [])) {
              if (p?.id) idToName[p.id] = String(p.name).trim();
            }
            const lastRound = Array.isArray(s.rounds) ? s.rounds[s.rounds.length - 1] : null;
            const finalMatch = Array.isArray(lastRound) ? lastRound[lastRound.length - 1] : null;
            const champId = finalMatch?.winner;
            const winner_name = (champId && idToName[champId]) || 'Champion';
            gh.onTournamentEnd({ winner_name });
          }
        },
        onCreated: (m: any) => {
          rawSubs.forEach(fn => fn({ type: 't.created', ...m }));
          TL.myPid = m.pid;
          TL.isHostLocal = true;
      
          TL.pendingLobbyCode = String(m.code || "");
        
        
          try {
            TL.lobbyCode!.classList.remove("hidden");
            TL.lobbyCodeTxt!.textContent = m.code;
          } catch {}
        },
        onMatchStart: (m:any) => {             
      lastMatchStart = { p1: m?.p1, p2: m?.p2 };
    },
        onJoined: (m: any) => {
          rawSubs.forEach(fn => fn({ type: 't.joined', ...m }));
          TL.myPid = m.pid;
          TL.isHostLocal = false;
        },
        onMatchResult: () => {},
        onEnded: (m: any) => {  
          rawSubs.forEach(fn => fn({ type: 't.ended', ...m }));
          gh.onTournamentEnd(m);
        },
      },

  {
    beforeStart: async (msg) => {
      setState(TLState.MatchAnnounce);
      resetAnnouncerLatch();
    
      TL.renderGate = false;
      try {
        if (TL.unmuteKeys) { TL.unmuteKeys(); TL.unmuteKeys = null; }
        TL.unmuteKeys = muteMatchKeys();
    
        TL.gameWrap!.classList.add('invisible','hidden');
        clearCanvasFrame();
    
        const { left, right } = currentMatchNamesFromLobby();
        const matchLabel = TL.lastLobby ? `Match ${Number(TL.lastLobby.currentMatch ?? 0) + 1}` : '';
    
        await showMatchAnnouncement({
          left, right, matchLabel,
          goalLimit: msg.goalLimit ?? (TL.lastLobby?.goalLimit ?? 5),
          maxWaitMs: 5000
        });
        if (TL.unmuteKeys) { TL.unmuteKeys(); TL.unmuteKeys = null; }
    
        TL.gameWrap!.classList.remove('invisible','hidden');
        revealGameArea();
      } finally {
        TL.renderGate = true;
        releaseAnnouncerLatch();
      }
    },
    onStart: gh.onStart,
    onState: gh.onState,
    onEnd:   gh.onMatchEnd,
  });
  (TL.sock as any).waitFor = (types: string[]) => waitForMessages(types);
    return TL.sock!;
  }
  function currentMatchNamesFromLobby(): { left: string; right: string } {
    const fallback = { left: 'Left', right: 'Right' };
    const lobby = TL.lastLobby;
    if (!lobby) return fallback;
  
    const r = Number.isInteger(lobby.currentRound) ? lobby.currentRound : 0;
    const m = Number.isInteger(lobby.currentMatch) ? lobby.currentMatch : 0;
  
    const rounds = Array.isArray(lobby.rounds) ? lobby.rounds : [];
    const mat = rounds?.[r]?.[m];
    if (!mat) return fallback;
  
    const idToName: Record<string,string> = {};
    for (const p of (Array.isArray(lobby.players) ? lobby.players : [])) {
      if (p?.id) {
        const nm = String(p.name).trim();
        if (nm) idToName[p.id] = nm;
      }
    }
  
    const left  = (mat.p1 && idToName[mat.p1]) || 'Left';
    const right = (mat.p2 && idToName[mat.p2]) || 'Right';
    return { left, right };
  }

  function showInlineError(el: HTMLElement, msg: string) {
    el.textContent = msg;
    el.classList.remove('hidden');
  }
  function hideInlineError(el: HTMLElement) {
    el.textContent = '';
    el.classList.add('hidden');
  }

  function onReadyClick() {
   TL.meReady = !TL.meReady;
    setReadyBtn();
    ensureSocket().tReady(TL.meReady);
  }
  function onStartClick() {
    ensureSocket().tStart();
  }

  btnJoin.onclick = async () => {
    const codeInput  = root.querySelector("#joinCodeInput") as HTMLInputElement;
    const aliasInput = root.querySelector("#joinAlias") as HTMLInputElement;
  
    const code  = String(codeInput.value || "").trim();
    if (!code) return;
  
    const joinErr = getOrCreateErrorEl("joinError", codeInput);
    hideInlineError(joinErr);
  
    const alias = aliasFromCaller || String(aliasInput.value || "").trim() || "Player";
  
    const prev = btnJoin.innerHTML;
    btnJoin.disabled = true;
    btnJoin.innerHTML = "Joining…";
  
    try {
      const api = ensureSocket();
      api.tJoin(code, alias);
      const joined = await api.waitFor(['t.joined']);
      TL.myPid = joined?.pid;
      mountNewPage();
      TL.meReady = false; setReadyBtn();
    } catch (e: any) {
      const msg = String(e?.message || "Failed to join lobby");
      showInlineError(joinErr, msg);
      btnJoin.disabled = false;
      btnJoin.innerHTML = prev;
    }
  };
  btnHost.onclick = async () => {
    const nameInput  = root.querySelector("#hostName")  as HTMLInputElement;
    const goalInput  = root.querySelector("#hostGoal")  as HTMLInputElement;
    const maxInput   = root.querySelector("#hostMax")   as HTMLInputElement;
    const aliasInput = root.querySelector("#hostAlias") as HTMLInputElement;
  
    const hostErr = getOrCreateErrorEl("hostError", nameInput);
    hideInlineError(hostErr);
  
    const name  = String(nameInput.value || "").trim() || "Tournament";
    const goal  = Math.max(1, Math.min(10, parseInt(goalInput.value || "5", 10) || 5));
    const max   = Math.max(2, Math.min(8,  parseInt(maxInput.value  || "8", 10) || 8));
    const alias = aliasFromCaller || String(aliasInput.value || "").trim() || "Host";
  
    const prev = btnHost.innerHTML;
    btnHost.disabled = true;
    btnHost.innerHTML = "Creating…";
  
    try {
      const api = ensureSocket();
      api.tCreate(name, goal, max, alias);
  
      const created = await api.waitFor(['t.created']);
      TL.myPid = created?.pid;
  
      mountNewPage();
      TL.meReady = false; setReadyBtn();
    } catch (e: any) {
      const msg = String(e?.message || "Failed to create tournament");
      showInlineError(hostErr, msg);
      btnHost.disabled = false;
      btnHost.innerHTML = prev;
    }
  };
}

