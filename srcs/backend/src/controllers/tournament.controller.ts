import { FastifyReply, FastifyRequest } from 'fastify';
import { ITournamentParams, createTournament, findTournamentById } from '../models/tournament.model';

export async function newTournament(req: FastifyRequest, reply: FastifyReply) {

	try {
	const { name } = req.body as{name: string;};
	const userId = req.userData?.id;
	if (!userId) {
		return reply.status(401).send({ message: 'Unauthorized' });
	  }

	const db = req.server.db;
	const tournament = await createTournament(db, { name: name.trim(), created_by: userId });

	reply.status(201)
		 .send({
			message: "success",
			tournament_id : tournament.id,
			name: name,
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
					name: tournament.name,
					created_by : tournament.created_by,
					created_at: tournament.created_at,
				}));
	} catch (err : any) {
	req.log.error(err);
	return reply.status(500).send({ message: 'Internal Server Error' });
	}
}
