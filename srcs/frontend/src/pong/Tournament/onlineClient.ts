import { openWs, type MatchHandlers, type StartMsg, type StateMsg, type EndMsg } from './wsClient';


export type TPlayer = { id: string; name: string; ready: boolean };
export type TMatch  = { id: string; p1?: string; p2?: string; winner?: string };
export type TRounds = TMatch[][];

export type TStateMsg = {
  type: 't.state';
  id: string;
  code: string;
  name: string;
  goalLimit: number;
  started: boolean;
  finished: boolean;
  currentRound: number;
  currentMatch: number;
  players: TPlayer[];
  rounds: TRounds;
};

export type TCreatedMsg    = { type: 't.created'; id: string; code: string };
export type TJoinedMsg     = { type: 't.joined'; id: string; pid: string };
export type TMatchStartMsg = { type: 't.matchStart'; r: number; m: number; p1: string; p2: string };
export type TMatchResultMsg= { type: 't.matchResult'; r: number; m: number; winner: string; score: [number, number] };
export type TEndedMsg      = { type: 't.ended'; champion: string; winner_name:string };

export type TClientHandlers = {
  onState?:      (s: TStateMsg) => void;
  onCreated?:    (m: TCreatedMsg) => void;
  onJoined?:     (m: TJoinedMsg) => void;
  onMatchStart?: (m: TMatchStartMsg) => void;
  onMatchResult?:(m: TMatchResultMsg) => void;
  onEnded?:      (m: TEndedMsg) => void;
};
export function openTourneySocket(tHandlers: TClientHandlers, gameHandlers?: MatchHandlers) {
  let beforeStartP: Promise<void> = Promise.resolve();
  let releaseBeforeStart: (() => void) | null = null;
  let started = false;
  const stateBuffer: StateMsg[] = [];

  function resetLatch() {
    started = false;
    stateBuffer.length = 0;
    beforeStartP = new Promise<void>((res) => { releaseBeforeStart = res; });
  }
  function releaseLatch() {
    if (releaseBeforeStart) { releaseBeforeStart(); releaseBeforeStart = null; }
  }
  resetLatch();

  const rawSubs = new Set<(m:any)=>void>();
  function _emitRaw(msg:any){ for (const fn of [...rawSubs]) { try{ fn(msg); }catch{} } }
  function waitFor<T extends string>(types: T[], opts: { timeoutMs?: number } = {}) {
    const { timeoutMs = 8000 } = opts;
    return new Promise<any>((resolve, reject) => {
      const handler = (msg:any) => {
        const t = msg?.type;
        if (t === 't.error') { cleanup(); reject(new Error(String(msg?.msg || 'Request failed'))); return; }
        if (types.includes(t)) { cleanup(); resolve(msg); }
      };
      const cleanup = () => { rawSubs.delete(handler); clearTimeout(to); };
      rawSubs.add(handler);
      const to = setTimeout(() => { cleanup(); reject(new Error('Request timed out')); }, timeoutMs);
    });
  }
  const wrappedHandlers: MatchHandlers = {
    beforeStart: async (m: StartMsg) => {
      resetLatch();
      if (gameHandlers?.beforeStart) { try { await gameHandlers.beforeStart(m); } catch {} }
      releaseLatch();
    },
    onStart: async (m: StartMsg) => {
      try { await beforeStartP; } catch {}
      started = true;
      gameHandlers?.onStart?.(m);
      while (stateBuffer.length) { try { gameHandlers?.onState?.(stateBuffer.shift()!); } catch {} }
    },
    onState: (s: StateMsg) => {
      if (!started) { stateBuffer.push(s); return; }
      gameHandlers?.onState?.(s);
    },
    onEnd: (e: EndMsg) => {
      started = false;
      stateBuffer.length = 0;
      gameHandlers?.onEnd?.(e);
    },
    onRaw:  (x: any) => {
      _emitRaw(x);
      switch (x?.type) {
        case 't.state':       tHandlers.onState?.(x as TStateMsg); break;
        case 't.created':     tHandlers.onCreated?.(x as TCreatedMsg); break;
        case 't.joined':      tHandlers.onJoined?.(x as TJoinedMsg); break;
        case 't.matchStart':  tHandlers.onMatchStart?.(x as TMatchStartMsg); break;
        case 't.matchResult': tHandlers.onMatchResult?.(x as TMatchResultMsg); break;
        case 't.ended':       tHandlers.onEnded?.(x as TEndedMsg); break;
      }

      gameHandlers?.onRaw?.(x);
    },
    onOpen: (e: Event) => gameHandlers?.onOpen?.(e),
    onClose:(e: CloseEvent) => gameHandlers?.onClose?.(e),
    onError:(e: Event) => gameHandlers?.onError?.(e),
  };
  const api = openWs(wrappedHandlers);

  return {
    ...api,
    waitFor, 

    tCreate: (name: string, goalLimit: number, maxPlayers: number, alias: string) =>
      api.send({ type: 't.create', name, goalLimit, maxPlayers, alias }),

    tJoin: (code: string, alias: string) =>
      api.send({ type: 't.join', code, alias }),

    tReady: (ready: boolean) =>
      api.send({ type: 't.ready', ready }),

    tStart: () =>
      api.send({ type: 't.start' }),
  };
}