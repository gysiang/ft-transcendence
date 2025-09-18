import type { WebSocket} from 'ws';
import { joinRoom, broadcast } from './rooms';
import { startMatch as runMatch } from './onlinePong';
import { leaveRoom } from './rooms';

type PlayerId = string;
type Side = 'left' | 'right';

export type TPlayer = {
   id: PlayerId;
   name: string;
   ws: WebSocket;
   ready: boolean;
   userId?: number | null};

export type TMatch = {
  id: string;
  p1?: PlayerId;
  p2?: PlayerId;
  winner?: PlayerId;
};


export type TRounds = TMatch[][];

export type TournamentOpts = {
  name: string;
  goalLimit: number;
  maxPlayers: number;
};
export type MatchStatus = {
  tournament_id: number;
  player1_alias: string;
  player2_alias: string | null;
  player1_score: number;
  player2_score: number;
  player1_id?: number | null;
  player2_id?: number | null;
  winner_id: number | null;
  winner_alias: string;
};

export type DbEntry = {
  createTournament: (name: string, createdBy?: number | null) => Promise<number>;
  createMatch: (data: MatchStatus) => Promise<void>;
};


let dbEntry: DbEntry | null = null;


export function setDbEntry(p: DbEntry) {
  dbEntry = p;
}

function uid(){
  return Math.random().toString(36).slice(2, 10); }

export class Tournament {
  id = uid();
  code = this.id.slice(0, 6);
  name: string;
  goalLimit: number;
  maxPlayers: number;

  backendTournamentId: number | null = null;
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

  addPlayer(ws: WebSocket, name: string, userId?: number | null): PlayerId {
    const id = uid();
    this.players.set(id, { id, name, ws, ready: false, userId: userId ?? null });
    joinRoom(ws, this.roomLobby());
    this.pushState();
    return id;
  }

  markReady(id: PlayerId, ready: boolean) {
    const p = this.players.get(id);
    if (!p) return;
    p.ready = ready;
    this.pushState();
  }

  setHost(id: PlayerId) {
    this.host = id;
    this.pushState();
  }

  roomLobby(){ 
    return `t:${this.id}:lobby`; }
  roomMatch(r: number, m: number){ 
   return `t:${this.id}:m:${r}:${m}`; }

  start = async () => {
    if (this.started)
        return;
    if (!this.backendTournamentId && dbEntry) {
      const createdBy = this.host ? (this.players.get(this.host)?.userId ?? null) : null;
      try {
        this.backendTournamentId = await dbEntry.createTournament(this.name, createdBy as number);
      } catch (err) {
        console.error('tournament database entry failed:', err);
        this.broadcastLobby({ type: 't.error', msg: 'Could not create tournament' });
        return;
      }
    }
    const list = [...this.players.values()];
    if (list.length < 2) { 
        this.broadcastLobby({ type:'t.error', msg:'Need at least 2 players' });
        return; }
    if (!list.every(p => p.ready)) { 
        this.broadcastLobby({ type:'t.error', msg:'All players must be ready' });
        return; }

    this.rounds = buildSingleElim(list.map(p => p.id));
    this.started = true;
    this.currentRound = 0;
    this.currentMatch = 0;

    this.pushState();
    this.StartCurrentMatch();
  }

  private StartCurrentMatch() {
    const r = this.currentRound;
    const m = this.currentMatch;
    const match = this.rounds[r][m];
    const p1 = match.p1 ? this.players.get(match.p1)! : undefined;
    const p2 = match.p2 ? this.players.get(match.p2)! : undefined;
  
    // bye case
    if (!p1 || !p2) {
      const only = p1 ?? p2!;
      match.winner = only.id;  
      this.advance();
      return;
    }
  
    joinRoom(p1.ws, this.roomMatch(r, m));
    joinRoom(p2.ws, this.roomMatch(r, m));
  
    runMatch(this.roomMatch(r, m),p1.ws,p2.ws,this.goalLimit,
      ({ winnerSide, score }) => {
        const winner = winnerSide === 'left' ? p1.id : p2.id;
        match.winner = winner;
  
        this.broadcastLobby({ type: 't.matchResult', r, m, winner, score });
  
        if (this.backendTournamentId && dbEntry) {
          const p1Alias = p1.name || 'Player 1';
          const p2Alias = p2.name || 'Player 2';
          const p1Id = p1.userId ?? null;
          const p2Id = p2.userId ?? null;
          const winId = (winner === p1.id ? p1Id : p2Id) ?? null;
          const winAlias = (winner === p1.id ? p1Alias : p2Alias);
  
          void dbEntry.createMatch({
            tournament_id: this.backendTournamentId,
            player1_alias: p1Alias,
            player2_alias: p2Alias,
            player1_score: score[0],
            player2_score: score[1],
            player1_id: p1Id,
            player2_id: p2Id,
            winner_id: winId,
            winner_alias: winAlias,
          }).catch(err => console.error('databse match entry failed:', err));
        }
        try { leaveRoom(p1.ws, this.roomMatch(r, m)); } catch {}
        try { leaveRoom(p2.ws, this.roomMatch(r, m)); } catch {}
        this.advance();
      }
    );
  
    this.broadcastLobby({ type: 't.matchStart', r, m, p1: p1.id, p2: p2.id });
  }

  private advance() {
    const r = this.currentRound;
    const round = this.rounds[r];
    if (round.every(mt => mt.winner)) {
      const winners = round.map(mt => mt.winner!) ;
      if (winners.length === 1) {
        this.finished = true;
        const winner_name = this.players.get(winners[0])?.name;
        this.broadcastLobby({ type:'t.ended', champion: winners[0] , winner_name});
        tournaments.delete(this.id);
        return;
      }
      this.rounds.push(advanceWinners(winners));
      this.currentRound++;
      this.currentMatch = 0;
      this.pushState();
      this.StartCurrentMatch();
      return;
    }

    this.currentMatch++;
    this.pushState();
    this.StartCurrentMatch();
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
//build the first round advance func does the rest
export function buildSingleElim(playerIds: PlayerId[]): TRounds {
  const n = playerIds.length;
  const pow2 = 1 << Math.ceil(Math.log2(n)); //bracket size
  const seeds = playerIds.slice();//shallow cpy
  while (seeds.length < pow2)
    seeds.push(undefined as any);

  const round0: TMatch[] = [];
  for (let i = 0; i < pow2; i += 2) {
    round0.push({ id: uid(), p1: seeds[i], p2: seeds[i+1] });
  }
  return [round0];
}

export function advanceWinners(winners: PlayerId[]): TMatch[] {
  const out: TMatch[] = [];
  for (let i = 0; i < winners.length; i += 2) {
    out.push({ id: uid(), p1: winners[i], p2: winners[i+1] });
  }
  return out;
}

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
