import { FastifyInstance } from 'fastify';
import { newTournament, getTournament } from '../controllers/tournament.controller';
import { newMatch, getMatch, getAllMatch } from '../controllers/match.controller';
import { ITournamentParams } from '../models/tournament.model'
import { IMatchParams } from '../models/match.model';
/*
export async function gameRoutes(app: FastifyInstance) {
	app.post('/api/game', {preHandler: [app.authenticate]}, newTournament);
	app.get<{Params: ITournamentParams}>('/api/game/:id',{preHandler: [app.authenticate]}, getTournament);
	app.post('/api/game/match', {preHandler: [app.authenticate]}, newMatch);
	app.get<{Params: IMatchParams}>('/api/game/match/:id',{preHandler: [app.authenticate]}, getMatch);
	app.get<{Params: IMatchParams}>('/api/game/data/:id', {preHandler: [app.authenticate]}, getAllMatch);

}*/

const aliasPattern = "^[A-Za-z0-9]+$"; 
const idStringDigits = "^[0-9]+$";             

const aliasSchema = { type: 'string', minLength: 1, maxLength: 32, pattern: aliasPattern };
const idSchema = { type: 'object',required: ['id'],additionalProperties: false,
  		properties: { id: { type: 'string', pattern: idStringDigits } },};

export async function gameRoutes(app: FastifyInstance) {
  app.post('/api/game', {preHandler: [app.authenticate],schema: {
      body: {
        type: 'object',
        required: ['player1_alias', 'player2_alias', 'created_by'],
        additionalProperties: false,
        properties: {
          player1_alias: aliasSchema,
          player2_alias: aliasSchema,
          created_by: { type: 'string', pattern: idStringDigits },
        },},},}, newTournament);

  app.get<{ Params: ITournamentParams }>('/api/game/:id',{preHandler: [app.authenticate], schema: { params: idSchema },},getTournament);
  app.post('/api/game/match', {preHandler: [app.authenticate],schema: {
      body: {
        type: 'object',
        required: [
          'player1_alias',
          'player2_alias',
          'player1_score',
          'player2_score',
          'winner',
          'tournament_id',
        ],
        additionalProperties: false,
        properties: {
          player1_alias: aliasSchema,
          player2_alias: aliasSchema,
          player1_score: { type: 'integer', minimum: 0, maximum: 10 },
          player2_score: { type: 'integer', minimum: 0, maximum: 10 },
          winner: aliasSchema,
          tournament_id: { type: 'integer', minimum: 1 },
        },},},}, newMatch);

  app.get<{ Params: IMatchParams }>('/api/game/match/:id',{preHandler: [app.authenticate],schema: { params: idSchema },},getMatch);
  app.get<{ Params: IMatchParams }>('/api/game/data/:id',{preHandler: [app.authenticate],schema: { params: idSchema },},getAllMatch);
}