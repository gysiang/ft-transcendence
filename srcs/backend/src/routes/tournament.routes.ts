import { FastifyInstance } from 'fastify';
import { newTournament, getTournament } from '../controllers/tournament.controller';
import { newMatch, getMatch, getAllMatch } from '../controllers/match.controller';
import { ITournamentParams } from '../models/tournament.model'
import { IMatchParams } from '../models/match.model';

export async function gameRoutes(app: FastifyInstance) {
	app.post('/api/game', {preHandler: [app.authenticate]}, newTournament);
	app.get<{Params: ITournamentParams}>('/api/game/:id',{preHandler: [app.authenticate]}, getTournament);
	app.post('/api/game/match', {preHandler: [app.authenticate]}, newMatch);
	app.get<{Params: IMatchParams}>('/api/game/match/:id',{preHandler: [app.authenticate]}, getMatch);
	app.get<{Params: IMatchParams}>('/api/game/data/:id', {preHandler: [app.authenticate]}, getAllMatch);

}
