import { FastifyReply, FastifyRequest } from 'fastify';
import { createMatch, findMatchById, getAllMatchData } from '../models/match.model';
import { IMatchParams } from '../models/match.model';
import { findTournamentById } from '../models/tournament.model';

export async function newMatch(req: FastifyRequest, reply: FastifyReply) {

	try
	{
		const { player1_alias, player2_alias, player1_score, player2_score, winner, tournament_id } = req.body as
		{
			player1_alias: string;
			player2_alias: string;
			player1_score: number;
			player2_score: number;
			winner: string;
			tournament_id: string;
		};

	const db = req.server.db;

	// check if the tournament exists
	const tournament = await findTournamentById(db, tournament_id);
	if (!tournament) {
		return reply.status(401).send({ message: "Invalid tournament id" });
	}

	const match = await createMatch(db, { player1_alias, player2_alias, player1_score, player2_score, winner, tournament_id });

	reply.status(201)
		 .send({
			message: "match created success",
		 })
	} catch (err : any) {
	req.log.error(err);
	return reply.status(500).send({ message: 'Internal Server Error' });
	}
}

export async function getMatch(req: FastifyRequest<{Params: IMatchParams}>, reply: FastifyReply)
{
	try {
		const { id } = req.params;

		if (!id) {
			return reply.status(400).send({ message: "id is required" });
		}
		const db = req.server.db;
		const match = await findMatchById(db, id);
		if (!match) {
			return reply.status(401).send({ message: "Invalid id" });
		}
		return (reply
				.status(200)
				.send({
					message: "Authentication success",
					id: match.id,
					player1: match.player1_alias,
					player2: match.player2_alias,
					player1_score: match.player1_score,
					player2_score: match.player2_score,
					winner: match.winner,
					tournament_id: match.tournament_id
				}));
	} catch (err : any) {
	req.log.error(err);
	return reply.status(500).send({ message: 'Internal Server Error' });
	}
}


export async function getAllMatch(req: FastifyRequest<{Params: IMatchParams}>, reply: FastifyReply) {
		try {
		const { id } = req.params;
		console.log("in getAllMatches")
		if (!id) {
			return reply.status(400).send({ message: "id is required" });
		}
		const db = req.server.db;
		const matches = await getAllMatchData(db, id);
		if (!matches) {
			return reply.status(401).send({ message: "Invalid id" });
		}
		return (reply
				.status(200)
				.send({
					message: "Authentication success",
					data: matches
				}));
	} catch (err : any) {
	req.log.error(err);
	return reply.status(500).send({ message: 'Internal Server Error' });
	}
}
