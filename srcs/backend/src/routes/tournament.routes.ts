import { FastifyInstance } from 'fastify';
import { newTournament, getTournament } from '../controllers/tournament.controller';
import { newMatch, getMatch, getAllMatch } from '../controllers/match.controller';
import { ITournamentParams } from '../models/tournament.model'
import { IMatchParams } from '../models/match.model';

export async function gameRoutes(app: FastifyInstance) {
	app.post('/api/game', {preHandler: [app.authenticate], schema:{
		body: {$ref: 'TournamentSchema#'}}}, newTournament);
	app.get<{Params: ITournamentParams}>('/api/game/:id',{preHandler: [app.authenticate],
		schema: { params: { $ref: 'IdString#' } }}, getTournament);
	app.post('/api/game/match', {preHandler: [app.authenticate], schema: { body: { $ref: 'MatchSchema#' } }}, newMatch);
	app.get<{Params: IMatchParams}>('/api/game/match/:id',{preHandler: [app.authenticate], schema: { params: { $ref: 'IdString#' } }}, getMatch);
	app.get<{Params: IMatchParams}>('/api/game/data/:id', {preHandler: [app.authenticate], schema: { params: { $ref: 'IdString#' } }}, getAllMatch);

}
