import { Database } from 'sqlite';

export interface Match {
	id?: string;
	player1_alias: string;
	player2_alias: string;
	player1_score: number;
	player2_score: number;
	winner: string;
	tournament_id: string;
}

export interface IMatchParams {
  id: string;
}

export async function createMatch(db: Database, match: Match)
{
	const { player1_alias, player2_alias, player1_score, player2_score, winner, tournament_id } = match;
	const result = await db.run(
		`INSERT INTO matches (player1_alias, player2_alias, player1_score, player2_score, winner, tournament_id, created_at)
		VALUES (?, ?, ?, ?, ?, ?, ?)`,
		[	player1_alias,
			player2_alias,
			parseInt(player1_score.toString(), 10),
			parseInt(player2_score.toString(), 10),
			winner,
			tournament_id,
			new Date().toISOString()]
	);
	return { id: result.lastID};
}

export async function findMatchById(db: Database, id: string) {
	return db.get<Match>(`SELECT * FROM matches WHERE id = ?`, [id]);
}
