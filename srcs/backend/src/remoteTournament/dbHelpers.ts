import type { FastifyInstance } from 'fastify';
import { createTournament as createTournamentRow } from '../models/tournament.model';
import { createMatch as createMatchRow } from '../models/match.model';
import type { DbEntry, MatchStatus } from './realtimeTournament';

export function makeDbEntry(app: FastifyInstance): DbEntry {
  const db = (app as any).db;

  return {
    async createTournament(name, createdBy) {
      if (!Number.isFinite(createdBy)) throw new Error('createTournament: createdBy is required');
      const { id } = await createTournamentRow(db, { name, created_by: String(createdBy) });
      return Number(id);
    },

    async createMatch(m: MatchStatus) {
      await createMatchRow(db, {
        tournament_id: String(m.tournament_id),
        player1_alias: m.player1_alias,
        player2_alias: m.player2_alias ?? null,
        player1_score: m.player1_score,
        player2_score: m.player2_score,
        winner_id: m.winner_id ?? null,
        winner_alias: m.winner_alias,
        player1_id: m.player1_id ?? null,
        player2_id: m.player2_id ?? null,
      });
    },
  };
}