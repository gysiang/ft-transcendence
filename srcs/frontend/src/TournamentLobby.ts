import { openTourneySocket } from './onlineClient';
import { createGameCanvas, lockCanvasWorld, unlockCanvas } from './pong/Renderer';
import { Game } from './pong/Pong.ts';
import type { StartMsg, StateMsg, EndMsg } from './wsClient';
import { renderTournamentBracket } from './pong/matchUI'; // reuse your existing renderer
import { adaptTRoundsToLocal } from './pong/matchUI';

export function renderTournamentScreen(root: HTMLElement) {
  root.innerHTML = `
    <div class="max-w-lg mx-auto space-y-4 text-black">
      <h2 class="text-2xl font-bold text-center">Online Tournament</h2>

      <div class="p-4 border rounded space-y-2">
        <h3 class="font-semibold">Host</h3>
        <input id="hostName" class="w-full p-2 border rounded" placeholder="Tournament name" value="Friday Cup" />
        <input id="hostAlias" class="w-full p-2 border rounded" placeholder="Your alias" value="Host" />
        <div class="flex gap-2">
          <input id="hostGoal"  class="w-1/2 p-2 border rounded" type="number" min="1" max="10" value="5" />
          <input id="hostMax"   class="w-1/2 p-2 border rounded" type="number" min="2" max="8" value="8" />
        </div>
        <button id="btnHost" class="w-full bg-green-600 text-white py-2 rounded">Create</button>
        <div id="joinCode" class="text-sm text-gray-700"></div>
      </div>

      <div class="p-4 border rounded space-y-2">
        <h3 class="font-semibold">Join</h3>
        <input id="joinCodeInput" class="w-full p-2 border rounded" placeholder="Join code" />
        <input id="joinAlias" class="w-full p-2 border rounded" placeholder="Your alias" value="Player" />
        <button id="btnJoin" class="w-full bg-blue-600 text-white py-2 rounded">Join</button>
      </div>

      <div id="lobby" class="p-4 border rounded hidden">
        <div class="flex items-center justify-between">
          <h3 class="font-semibold">Lobby</h3>
          <button id="btnReady" class="bg-amber-600 text-white px-3 py-1 rounded">Ready</button>
        </div>
        <div id="players" class="text-sm mt-2"></div>
        <button id="btnStart" class="w-full mt-3 bg-purple-600 text-white py-2 rounded hidden">Start</button>
        <div id="bracketWrap" class="mt-4"></div>
      </div>

      <div id="gameWrap" class="mt-6"></div>
    </div>
  `;

  const el = <T extends HTMLElement>(id: string) => root.querySelector<T>(`#${id}`)!;

  const btnHost = el<HTMLButtonElement>('btnHost');
  const btnJoin = el<HTMLButtonElement>('btnJoin');
  const btnReady = el<HTMLButtonElement>('btnReady');
  const btnStart = el<HTMLButtonElement>('btnStart');
  const joinCode = el<HTMLDivElement>('joinCode');
  const lobby = el<HTMLDivElement>('lobby');
  const playersDiv = el<HTMLDivElement>('players');
  const bracketWrap = el<HTMLDivElement>('bracketWrap');
  const gameWrap = el<HTMLDivElement>('gameWrap');

  let meReady = false;
  let isHost = false;
  let sock: ReturnType<typeof openTourneySocket> | null = null;
  let game: Game | null = null;

  const setReadyBtn = () => {
    btnReady.textContent = meReady ? 'Unready' : 'Ready';
    btnReady.classList.toggle('bg-amber-600', !meReady);
    btnReady.classList.toggle('bg-gray-600',  meReady);
  };

  function ensureSocket() {
    if (sock) return sock;
    const gh = {
      onStart: (msg: StartMsg) => {
        gameWrap.innerHTML = '';
        const { canvas, container } = createGameCanvas();
        gameWrap.appendChild(container);

        const ctx = canvas.getContext('2d')!;
        const players = [
          { name: 'Left',  side: 'left'  as const },
          { name: 'Right', side: 'right' as const },
        ];
        if (msg.world) lockCanvasWorld(canvas, msg.world.w, msg.world.h);

        game = new Game(canvas, ctx, players, msg.goalLimit);
        game.enableNetMode();
        game.startCountdown();
      },
      onState: (msg: StateMsg) => {
        game?.applyNetState({
          ball:  { x: msg.ball.x, y: msg.ball.y, r: msg.ball.r },
          left:  msg.left,
          right: msg.right,
        });
      },
      onEnd: (msg: EndMsg) => {
        const canvas = gameWrap.querySelector('canvas') as HTMLCanvasElement | null;
        if (canvas) unlockCanvas(canvas);
        game = null;
      },
    };

    sock = openTourneySocket(
      {
        onState: (s) => {
          lobby.classList.remove('hidden');
          playersDiv.innerHTML =
            s.players.map(p => `• ${p.name} ${p.ready ? '✅' : '⌛'}`).join('<br/>');
          const allReady = s.players.length >= 2 && s.players.every(p => p.ready);
          btnStart.classList.toggle('hidden', !(isHost && allReady && !s.started));

          bracketWrap.innerHTML = '<div id="bracket" class="space-y-4 text-sm"></div>';
          const localRounds = adaptTRoundsToLocal(s.rounds, s.players);
          renderTournamentBracket(localRounds)},
        onCreated: (m) => { joinCode.textContent = `Join code: ${m.code}`; },
        onJoined:  () => {  },
        onMatchStart: () => { },
        onMatchResult:() => {},
        onEnded:      () => { },
      },
      gh
    );
    return sock!;
  }

  // Host/create
  btnHost.onclick = () => {
    const name  = (root.querySelector('#hostName')  as HTMLInputElement).value.trim() || 'Tournament';
    const alias = (root.querySelector('#hostAlias') as HTMLInputElement).value.trim() || 'Host';
    const goal  = parseInt((root.querySelector('#hostGoal')  as HTMLInputElement).value, 10) || 5;
    const max   = parseInt((root.querySelector('#hostMax')   as HTMLInputElement).value, 10) || 8;

    isHost = true;
    ensureSocket().tCreate(name, goal, max, alias);
    meReady = false; setReadyBtn();
  };

  // Join
  btnJoin.onclick = () => {
    const code  = (root.querySelector('#joinCodeInput') as HTMLInputElement).value.trim();
    const alias = (root.querySelector('#joinAlias')     as HTMLInputElement).value.trim() || 'Player';
    if (!code) return;
    isHost = false;
    ensureSocket().tJoin(code, alias);
    meReady = false; setReadyBtn();
  };

  // Ready toggle
  btnReady.onclick = () => {
    meReady = !meReady;
    setReadyBtn();
    ensureSocket().tReady(meReady);
  };

  // Host starts
  btnStart.onclick = () => {
    ensureSocket().tStart();
  };

  setReadyBtn();
}
