import { Database } from 'sqlite';

export interface Match {
	id?: string;
	player1_alias: string;
	player2_alias: string | null;
	player1_score: number;
	player2_score: number;
	winner_alias: string;
	tournament_id: string;
	player1_id: number | null;
	player2_id: number | null;
	winner_id: number | null;
}

export interface IMatchParams {
  id: string;
}

export async function createMatch(db: Database, match: Match)
{
	const { player1_alias, player2_alias, player1_score, player2_score, winner_alias, tournament_id, player1_id, player2_id, winner_id} = match;
	const result = await db.run(
		`INSERT INTO matches (player1_alias, player2_alias, player1_score, player2_score, winner_id, winner_alias, tournament_id, player1_id, player2_id, created_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		[	player1_alias,
			player2_alias,
			parseInt(player1_score.toString(), 10),
			parseInt(player2_score.toString(), 10),
			winner_id,
			winner_alias,
			tournament_id,
			player1_id,
			player2_id,
			new Date().toISOString()]
	);
	return { id: result.lastID};
}

export async function findMatchById(db: Database, id: string) {
	return db.get<Match>(`SELECT * FROM matches WHERE id = ?`, [id]);
}

export async function getAllMatchData(db: Database, id: string) {
	const result = await db.all(
		
		`SELECT m.*
		FROM matches m
		WHERE (m.player1_id = ? OR m.player2_id = ?)
		ORDER BY m.created_at DESC;
		`,
		[id, id]
	);
	return result;
}
