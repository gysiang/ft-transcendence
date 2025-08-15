import { api } from "../registration/apiWrapper";

export type CreateTournamentBody = {
    player1_alias: string;
    player2_alias: string;
    created_by: string;
  };
  export type CreateTournamentRes = { id?: number; tournament_id?: number; message?: string };
  
  export type CreateMatchBody = {
    player1_alias: string;
    player2_alias: string;
    player1_score: number;
    player2_score: number;
    winner: string;
    tournament_id: number | string;
  };
  export type CreateMatchRes = { id: number };
  
  export async function createTournament(body: CreateTournamentBody, signal?: AbortSignal) {
    const res = await api<CreateTournamentRes>('http://localhost:3000/api/game', {
      method: 'POST',
      body: JSON.stringify(body),
      signal,
    });
    const id = (res as any).id ?? (res as any).tournament_id;
    if (typeof id !== 'number') throw new Error('Backend did not return a tournament id');
    return id;
  }
  
  export async function createMatch(body: CreateMatchBody, signal?: AbortSignal) {
    return api<CreateMatchRes>('http://localhost:3000/api/game/match', {
      method: 'POST',
      body: JSON.stringify(body),
      signal,
    });
  }