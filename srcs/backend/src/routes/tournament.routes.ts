import { FastifyInstance } from 'fastify';
import { newTournament, getTournament } from '../controllers/tournament.controller';
import { ITournamentParams } from '../models/tournament.model'

export async function gameRoutes(app: FastifyInstance) {
	app.post('/api/game', {preHandler: [app.authenticate]}, newTournament);
	app.get<{Params: ITournamentParams}>('/api/game/:id',{preHandler: [app.authenticate]}, getTournament);

}
