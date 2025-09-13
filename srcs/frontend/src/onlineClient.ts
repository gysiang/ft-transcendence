import { openWs, type MatchHandlers, type StartMsg, type StateMsg, type EndMsg } from './wsClient';

/* ----- Strong types for tournament messages ----- */
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
export type TEndedMsg      = { type: 't.ended'; champion: string };

export type TClientHandlers = {
  onState?:      (s: TStateMsg) => void;
  onCreated?:    (m: TCreatedMsg) => void;
  onJoined?:     (m: TJoinedMsg) => void;
  onMatchStart?: (m: TMatchStartMsg) => void;
  onMatchResult?:(m: TMatchResultMsg) => void;
  onEnded?:      (m: TEndedMsg) => void;
};

/**
 * Open ONE websocket for both tournament + gameplay.
 * Pass your normal game handlers so online matches still start.
 */
export function openTourneySocket(tHandlers: TClientHandlers, gameHandlers?: MatchHandlers) {
  const api = openWs({
    // Forward gameplay handlers so match.start/state/end still work
    onStart: gameHandlers?.onStart as ((m: StartMsg) => void) | undefined,
    onState: gameHandlers?.onState as ((m: StateMsg) => void) | undefined,
    onEnd:   gameHandlers?.onEnd   as ((m: EndMsg)   => void) | undefined,

    // Tournament messages come via onRaw
    onRaw: (msg: any) => {
      switch (msg?.type) {
        case 't.state':       tHandlers.onState?.(msg as TStateMsg); break;
        case 't.created':     tHandlers.onCreated?.(msg as TCreatedMsg); break;
        case 't.joined':      tHandlers.onJoined?.(msg as TJoinedMsg); break;
        case 't.matchStart':  tHandlers.onMatchStart?.(msg as TMatchStartMsg); break;
        case 't.matchResult': tHandlers.onMatchResult?.(msg as TMatchResultMsg); break;
        case 't.ended':       tHandlers.onEnded?.(msg as TEndedMsg); break;
        // ignore other messages; gameplay handled above
      }
    }
  });

  return {
    ...api, // includes ws, send, queue, input, close (from your patched openWs)

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