// realtime/tournaments.ts
import type { WebSocket as WSSocket } from 'ws';
import { joinRoom, broadcast } from './rooms';
import { startAuthoritativeMatch as runMatch } from './onlineTourn'; // export it there
// If runMatch isn't exported, move it into a shared module and export.

type PlayerId = string;
type Side = 'left' | 'right';

export type TPlayer = { id: PlayerId; name: string; ws: WSSocket; ready: boolean };
export type TMatch = {
  id: string;
  p1?: PlayerId; p2?: PlayerId;
  winner?: PlayerId;
};
export type TRounds = TMatch[][];

export type TournamentOpts = {
  name: string;
  goalLimit: number;
  maxPlayers: number; // 2–8
};

function uid() { return Math.random().toString(36).slice(2, 10); }

export class Tournament {
  id = uid();
  code = this.id.slice(0, 6); // easy join code
  name: string;
  goalLimit: number;
  maxPlayers: number;

  host!: PlayerId;
  players = new Map<PlayerId, TPlayer>();
  rounds: TRounds = [];
  currentRound = 0;
  currentMatch = 0;
  started = false;
  finished = false;

  constructor(opts: TournamentOpts) {
    this.name = opts.name;
    this.goalLimit = opts.goalLimit;
    this.maxPlayers = opts.maxPlayers;
  }

  addPlayer(ws: WSSocket, name: string): PlayerId {
    const id = uid();
    this.players.set(id, { id, name, ws, ready: false });
    joinRoom(ws, this.roomLobby());
    this.pushState();
    return id;
  }

  markReady(id: PlayerId, ready: boolean) {
    const p = this.players.get(id); if (!p) return;
    p.ready = ready;
    this.pushState();
  }

  setHost(id: PlayerId) {
    this.host = id;
    this.pushState();
  }

  roomLobby() { return `t:${this.id}:lobby`; }
  roomMatch(r: number, m: number) { return `t:${this.id}:m:${r}:${m}`; }

  start() {
    if (this.started) return;
    const list = [...this.players.values()];
    if (list.length < 2) { this.broadcastLobby({ type:'t.error', msg:'Need at least 2 players' }); return; }
    if (!list.every(p => p.ready)) { this.broadcastLobby({ type:'t.error', msg:'All players must be ready' }); return; }

    this.rounds = buildSingleElim(list.map(p => p.id)); // BYEs handled inside
    this.started = true;
    this.currentRound = 0;
    this.currentMatch = 0;

    this.pushState();
    this.kickoffCurrentMatch();
  }

  private kickoffCurrentMatch() {
    const r = this.currentRound, m = this.currentMatch;
    const match = this.rounds[r][m];
    const p1 = match.p1 ? this.players.get(match.p1)! : undefined;
    const p2 = match.p2 ? this.players.get(match.p2)! : undefined;

    // BYE handling
    if (!p1 || !p2) {
      match.winner = (p1?.id ?? p2?.id)!;
      this.advance();
      return;
    }

    // Move both sockets to a dedicated match room (optional, for broadcast grouping)
    joinRoom(p1.ws, this.roomMatch(r,m));
    joinRoom(p2.ws, this.roomMatch(r,m));

    // Start the server-authoritative game
    runMatch(
      this.roomMatch(r,m),
      p1.ws,
      p2.ws,
      this.goalLimit,
      // onMatchEnd callback:
      ({ winnerSide, score }) => {
        const winner = winnerSide === 'left' ? p1.id : p2.id;
        match.winner = winner;
        this.broadcastLobby({ type:'t.matchResult', r, m, winner, score });
        this.advance();
      }
    );

    // Let only the two players receive match.start; everyone else watches bracket via t.state
    this.broadcastLobby({ type:'t.matchStart', r, m, p1: p1.id, p2: p2.id });
  }

  private advance() {
    const r = this.currentRound;
    const round = this.rounds[r];
    // If round complete, build next round from winners
    if (round.every(mt => mt.winner)) {
      const winners = round.map(mt => mt.winner!) ;
      if (winners.length === 1) {
        this.finished = true;
        this.broadcastLobby({ type:'t.ended', champion: winners[0] });
        return;
      }
      this.rounds.push(buildRoundFromSeeds(winners));
      this.currentRound++;
      this.currentMatch = 0;
      this.pushState();
      this.kickoffCurrentMatch();
      return;
    }

    // Otherwise move to next match within the round
    this.currentMatch++;
    this.pushState();
    this.kickoffCurrentMatch();
  }

  private broadcastLobby(payload: unknown) {
    broadcast(this.roomLobby(), payload);
  }

  private pushState() {
    const state = {
      type: 't.state' as const,
      id: this.id,
      code: this.code,
      name: this.name,
      goalLimit: this.goalLimit,
      started: this.started,
      finished: this.finished,
      currentRound: this.currentRound,
      currentMatch: this.currentMatch,
      players: [...this.players.values()].map(p => ({ id: p.id, name: p.name, ready: p.ready })),
      rounds: this.rounds
    };
    this.broadcastLobby(state);
  }
}

/* ---------- Bracket helpers (single-elim + BYEs) ---------- */

export function buildSingleElim(playerIds: PlayerId[]): TRounds {
  // Seed to next power of 2 with BYEs
  const n = playerIds.length;
  const pow2 = 1 << Math.ceil(Math.log2(n));
  const seeds = playerIds.slice();
  while (seeds.length < pow2) seeds.push(undefined as any); // BYE

  const round0: TMatch[] = [];
  for (let i = 0; i < pow2; i += 2) {
    round0.push({ id: uid(), p1: seeds[i], p2: seeds[i+1] });
  }
  return [round0];
}

export function buildRoundFromSeeds(winners: PlayerId[]): TMatch[] {
  const out: TMatch[] = [];
  for (let i = 0; i < winners.length; i += 2) {
    out.push({ id: uid(), p1: winners[i], p2: winners[i+1] });
  }
  return out;
}

/* ---------- Registry (multiple tournaments) ---------- */

export const tournaments = new Map<string, Tournament>();

export function createTournament(opts: TournamentOpts) {
  const t = new Tournament(opts);
  tournaments.set(t.id, t);
  return t;
}

export function getByCode(code: string) {
  for (const t of tournaments.values()) if (t.code === code) return t;
  return undefined;
}
