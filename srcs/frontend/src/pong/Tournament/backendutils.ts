import { api } from "../registration/apiWrapper";
import { API_BASE } from '../../variable.ts'

export type CreateTournamentBody = {
    name: string;
  };
export type CreateTournamentRes = {tournament_id?: number; message?: string};
  
  export type CreateMatchBody = {
    tournament_id: number;
    player1_alias?: string;
    player2_alias?: string | null;
    player1_id?: number | null;
    player2_id?: number | null;
    player1_score?: number;
    player2_score?: number;
    winner_id?: number | null;
    winner_alias?: string | null;
  };
  export type CreateMatchRes = { id: number };
  
  export async function createTournament(body: CreateTournamentBody, signal?: AbortSignal) {
    const res = await api<CreateTournamentRes>(`${API_BASE}/api/game`, {
      method: 'POST',
      body: JSON.stringify(body),
      signal,
    });
    const id = res.tournament_id;
    if (typeof id !== 'number') throw new Error('Backend did not return a tournament id');
    return id;
  }
  
  export async function createMatch(body: CreateMatchBody, signal?: AbortSignal) {
    return api<CreateMatchRes>(`${API_BASE}/api/game/match`, {
      method: 'POST',
      body: JSON.stringify(body),
      signal,
    });
  }