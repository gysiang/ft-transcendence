
import { openTourneySocket } from './onlineClient';
import { Game } from './pong/Pong.ts';
import { lockCanvasWorld, unlockCanvas } from './pong/Renderer';
import { renderTournamentBracket, adaptTRoundsToLocal } from './pong/matchUI';

export type LobbyOpts = { alias?: string; lockAlias?: boolean };

export function renderTournamentScreen(root: HTMLElement, opts: LobbyOpts = {}) {
  const aliasFromCaller = String(opts.alias ?? '').trim();

  const cls = {
    wrap: "max-w-5xl mx-auto p-4 sm:p-6 text-slate-900",
    title: "text-3xl font-semibold tracking-tight text-center",
    card: "p-5 sm:p-6 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-4",
    label: "text-sm font-medium text-slate-700",
    input: "w-full mt-1 rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder-slate-400 shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white read-only:bg-white read-only:border-slate-200 read-only:cursor-default",
    number: "w-full mt-1 rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder-slate-400 shadow-sm outline-none appearance-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white",
    btnBase: "inline-flex items-center justify-center rounded-xl px-4 py-2.5 font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none",
    btnPrimary: "bg-blue-600 text-white hover:bg-blue-700",
    codeChip: "inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700",
    sectionTitle: "text-base font-semibold",
    subtle: "text-sm text-slate-600",
  };

  root.innerHTML = `
    <div class="${cls.wrap}">
      <h2 class="${cls.title}">Online Tournament</h2>

      <!-- Top: Game (left) + Lobby (right) -->
      <div class="grid gap-6 md:grid-cols-3 mt-6">
        <div class="md:col-span-2">
          <div id="gameWrap" class="hidden">
            <div id="gameContainer" class="relative w-full h-[60vh] min-h-[360px] border border-slate-200 rounded-2xl overflow-hidden bg-white">
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
            <!-- Join code -->
            <div id="lobbyCode" class="${cls.codeChip} hidden mt-1 w-max">
              <span id="lobbyCodeTxt">—</span>
            </div>
          </div>

          <div id="players" class="text-sm grid gap-1 mt-3"></div>
          <div id="bracketWrap" class="mt-3"></div>
        </div>
      </div>

      <!-- Forms -->
      <div id="formsWrap" class="grid gap-6 md:grid-cols-2 mt-6">
        <div class="${cls.card}">
          <h3 class="${cls.sectionTitle}">Host</h3>
          <div>
            <label for="hostName" class="${cls.label}">Tournament name</label>
            <input id="hostName" class="${cls.input}" placeholder="Tournament name" value="Tournament" />
          </div>
          <div>
            <label for="hostAlias" class="${cls.label}">Your alias</label>
            <input id="hostAlias" class="${cls.input}" placeholder="Your alias" value="${aliasFromCaller || 'Host'}" />
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
            <input id="joinAlias" class="${cls.input}" placeholder="Your alias" value="${aliasFromCaller || 'Player'}" />
          </div>
          <button id="btnJoin" class="${cls.btnBase} ${cls.btnPrimary} w-full">Join</button>
        </div>
      </div>
    </div>
  `;

  const el = <T extends HTMLElement>(id: string) => root.querySelector<T>(`#${id}`)!;
  if (opts.lockAlias) {
    el<HTMLInputElement>('hostAlias').readOnly = true;
    el<HTMLInputElement>('joinAlias').readOnly = true;
  }

  const btnHost       = el<HTMLButtonElement>('btnHost');
  const btnJoin       = el<HTMLButtonElement>('btnJoin');
  const btnReady      = el<HTMLButtonElement>('btnReady');
  const btnStart      = el<HTMLButtonElement>('btnStart');
  const lobbyCode     = el<HTMLDivElement>('lobbyCode');
  const lobbyCodeTxt  = el<HTMLSpanElement>('lobbyCodeTxt');
  const lobby         = el<HTMLDivElement>('lobby');
  const playersDiv    = el<HTMLDivElement>('players');
  const bracketWrap   = el<HTMLDivElement>('bracketWrap');
  const gameWrap      = el<HTMLDivElement>('gameWrap');
  const gameContainer = el<HTMLDivElement>('gameContainer');
  const gameCanvas    = el<HTMLCanvasElement>('gameCanvas');
  const formsWrap     = el<HTMLDivElement>('formsWrap');

  // Local state
  let meReady = false;
  let myPid: string | null = null;
  let isHostLocal = false;
  let sock: ReturnType<typeof openTourneySocket> | null = null;
  let game: any = null;
  let worldW = 800, worldH = 600;
  let lastLobby: any = null;
  let myAlias = aliasFromCaller;

  const setReadyBtn = () => {
    btnReady.textContent = meReady ? 'Unready' : 'Ready';
    btnReady.classList.toggle('bg-blue-600', !meReady);
    btnReady.classList.toggle('hover:bg-blue-700', !meReady);
    btnReady.classList.toggle('bg-blue-800',  meReady);
    btnReady.classList.toggle('hover:bg-blue-900', meReady);
  };

  function revealGameArea() {
    gameWrap.classList.remove('hidden');
    lobby.classList.remove('hidden');
    formsWrap.classList.add('opacity-40', 'pointer-events-none');
  }

  function relockWorld() {
    try { unlockCanvas(gameCanvas); } catch {}
    try { lockCanvasWorld(gameCanvas, worldW, worldH); } catch {}
  }
  const ro = new ResizeObserver(() => relockWorld());
  ro.observe(gameContainer);
  window.addEventListener('resize', relockWorld);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) relockWorld(); });

  const norm = (s: unknown) => String(s ?? '').trim();
  const eqCI = (a?: string|null, b?: string|null) => (a??'').toLowerCase() === (b??'').toLowerCase();

  function playerNameMap(lobby: any): Record<string, string> {
    const map: Record<string,string> = {};
    const arr = Array.isArray(lobby?.players) ? lobby.players : [];
    for (const p of arr) {
      const id = p?.id ?? p?.pid ?? p?.playerId ?? p?.uid;
      const nm = norm(p?.name ?? p?.alias ?? p?.displayName);
      if (id && nm) map[id] = nm;
    }
    return map;
  }

  function pickOpponent(lobby: any, myPid: string|null, myAlias: string, fallback='Opponent') {
    const arr = Array.isArray(lobby?.players) ? lobby.players : [];
    for (const p of arr) {
      const id = p?.id ?? p?.pid ?? p?.playerId ?? p?.uid;
      const nm = norm(p?.name ?? p?.alias ?? p?.displayName);
      if (id && myPid && id === myPid) continue;
      if (nm && !eqCI(nm, myAlias)) return nm;
    }
    return fallback;
  }

  function resolveMatchNames(m: any): { left: string; right: string } {
  
    let left  = norm(m?.leftName);
    let right = norm(m?.rightName);

    if ((!left || !right) && lastLobby) {
      const map = playerNameMap(lastLobby);
      const lByPid = map[m?.leftPid as string];
      const rByPid = map[m?.rightPid as string];
      if (!left && lByPid) left = lByPid;
      if (!right && rByPid) right = rByPid;

      const mySide = (m?.side === 'left' || m?.side === 'right') ? m.side : null;
      if (mySide) {
        const meName = norm(myAlias || lastLobby?.me?.name || lastLobby?.self?.name);
        const opp    = pickOpponent(lastLobby, myPid, meName);
        if (mySide === 'left') {
          if (!left) left   = meName || 'Me';
          if (!right) right = opp;
        } else {
          if (!right) right = meName || 'Me';
          if (!left)  left  = opp;
        }
      }
      const arr = Array.isArray(lastLobby?.players) ? lastLobby.players : [];
      if ((!left || !right) && arr.length === 2) {
        left  = left  || norm(arr[0]?.name ?? arr[0]?.alias ?? 'Player 1');
        right = right || norm(arr[1]?.name ?? arr[1]?.alias ?? 'Player 2');
      }
    }

    if (!left)  left  = 'Left';
    if (!right) right = 'Right';
    if (eqCI(left, right)) right = right + ' (R)'; 
    return { left, right };
  }

  function setStartVisibility(s: any) {
    lastLobby = s; 
    const me = (s.me ?? s.self);
    if (!myPid && me && typeof me.id === 'string') myPid = me.id;

    const hostPid = s.host ?? s.hostPid ?? s.hostId ?? s.owner ?? (s.hostPlayer && s.hostPlayer.id) ?? null;
    const iAmHost = hostPid && myPid ? (hostPid === myPid) : isHostLocal;

    const players = Array.isArray(s.players) ? s.players : [];
    const notStarted = !s.started;
    const canStart = notStarted && players.length >= 2;

    btnStart.classList.toggle('hidden', !iAmHost);
    btnStart.disabled = !canStart;
    btnStart.tabIndex = iAmHost ? 0 : -1;
  }

  function isGameState(m: any): m is { ball: { x:number; y:number; r?:number }, left:any, right:any } {
    return !!(m && m.ball && typeof m.ball.x === 'number' && typeof m.ball.y === 'number');
  }

  function ensureSocket() {
    if (sock) return sock;

    const gh = {
      onStart: (msg: any) => {
        revealGameArea();

        if (msg.world && typeof msg.world.w === 'number' && typeof msg.world.h === 'number') {
          worldW = msg.world.w; worldH = msg.world.h;
        } else { worldW = 800; worldH = 600; }

        relockWorld();
        const names = resolveMatchNames(msg);
        const ctx = gameCanvas.getContext('2d')!;
        const players = [
          { name: names.left,  side: 'left'  as const },
          { name: names.right, side: 'right' as const },
        ];

        game = new Game(gameCanvas, ctx, players, msg.goalLimit);
        game.enableNetMode();
        game.startCountdown();
        requestAnimationFrame(relockWorld);
        setTimeout(relockWorld, 0);
      },

      onState: (msg: any) => {
        if (!isGameState(msg)) return;
        game?.applyNetState({
          ball:  { x: msg.ball.x, y: msg.ball.y, r: (msg as any).ball?.r ?? 8 },
          left:  msg.left,
          right: msg.right,
        });
      },

      onEnd: (_msg: any) => {
        game = null;
        try { unlockCanvas(gameCanvas); } catch {}
        const ctx = gameCanvas.getContext('2d');
        ctx?.setTransform(1,0,0,1,0,0);
        ctx?.clearRect(0,0,gameCanvas.width,gameCanvas.height);
        gameWrap.classList.add('hidden');
        formsWrap.classList.remove('opacity-40', 'pointer-events-none');
      },
    };

    sock = openTourneySocket(
      {
        onState: (s: any) => {
          lobby.classList.remove('hidden');

          const me = (s.me ?? s.self);
          if (!myPid && me && typeof me.id === 'string') myPid = me.id;
          const arr = Array.isArray(s.players) ? s.players : [];
          playersDiv.innerHTML = arr.map((p: any) =>
            `<div class="flex items-center justify-between rounded-lg px-3 py-2 bg-slate-50">
              <span>• ${String(p?.name ?? p?.alias ?? 'Player')}</span>
              <span class="text-xs ${p.ready ? 'text-emerald-600' : 'text-amber-600'}">
                ${p.ready ? 'Ready' : 'Waiting'}
              </span>
            </div>`
          ).join('');

          // Bracket
          bracketWrap.innerHTML = '<div id="bracket" class="space-y-4 text-sm"></div>';
          const localRounds = adaptTRoundsToLocal(s.rounds ?? [], arr);
          renderTournamentBracket(localRounds);

          setStartVisibility(s);
          if (isGameState(s)) gh.onState(s);
        },

        onCreated: (m: any) => {
          myPid = m.pid ?? m.me?.pid ?? m.me?.id ?? m.self?.id ?? myPid;
          isHostLocal = true;
          lobbyCode.classList.remove('hidden');
          lobbyCodeTxt.textContent = m.code;
        },

        onJoined: (m: any) => {
          myPid = m.pid ?? m.me?.pid ?? m.me?.id ?? m.self?.id ?? myPid;
          isHostLocal = false;
        },

        onMatchStart: (m: any) => gh.onStart(m),
        onMatchResult: () => {},
        onEnded:      () => gh.onEnd({}),
      },
      gh
    );
    return sock!;
  }
  btnHost.onclick = () => {
    const name = norm(el<HTMLInputElement>('hostName').value) || 'Tournament';
    const goal = parseInt(el<HTMLInputElement>('hostGoal').value, 10) || 5;
    const max  = parseInt(el<HTMLInputElement>('hostMax').value, 10) || 8;

    myAlias = aliasFromCaller || norm(el<HTMLInputElement>('hostAlias').value) || 'Host';
    isHostLocal = true;
    btnHost.disabled = true;
    ensureSocket().tCreate(name, goal, max, myAlias);
    meReady = false; setReadyBtn();
  };

  btnJoin.onclick = () => {
    const code = norm(el<HTMLInputElement>('joinCodeInput').value);
    if (!code) return;

    myAlias = aliasFromCaller || norm(el<HTMLInputElement>('joinAlias').value) || 'Player';
    isHostLocal = false;
    btnJoin.disabled = true;
    ensureSocket().tJoin(code, myAlias);
    meReady = false; setReadyBtn();
  };

  btnReady.onclick = () => {
    meReady = !meReady;
    setReadyBtn();
    ensureSocket().tReady(meReady);
  };

  btnStart.onclick = () => {
    ensureSocket().tStart();
  };

  setReadyBtn();
}
