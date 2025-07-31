import { FastifyReply, FastifyRequest } from 'fastify';
import { ITournamentParams, createTournament, findTournamentById } from '../models/tournament.model';

export async function newTournament(req: FastifyRequest, reply: FastifyReply) {

	try {
		const { player1_alias, player2_alias, created_by } = req.body as
		{
			player1_alias: string;
			player2_alias: string;
			created_by: string;
		};

	const db = req.server.db;
	const tournament = await createTournament(db, { player1_alias, player2_alias, created_by });

	reply.status(201)
		 .send({
			message: "success",
			tournament_id : tournament.id
		 })
	} catch (err : any) {
	req.log.error(err);
	return reply.status(500).send({ message: 'Internal Server Error' });
	}
}

export async function getTournament(req: FastifyRequest<{Params: ITournamentParams}>, reply: FastifyReply)
{
	try {
		const { id } = req.params;

		if (!id) {
			return reply.status(400).send({ message: "id is required" });
		}
		const db = req.server.db;
		const tournament = await findTournamentById(db, id);
		if (!tournament) {
			return reply.status(401).send({ message: "Invalid id" });
		}
		return (reply
				.status(200)
				.send({
					message: "Authentication success",
					id: tournament.id,
					player1: tournament.player1_alias,
					player2: tournament.player2_alias,
					created_by : tournament.created_by
				}));
	} catch (err : any) {
	req.log.error(err);
	return reply.status(500).send({ message: 'Internal Server Error' });
	}
}
