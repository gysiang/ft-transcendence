import { Database } from 'sqlite';

export interface Tournament {
	id?: string;
	player1_alias: string;
	player2_alias: string;
	created_by: string;
}

export interface ITournamentParams {
  id: string;
}

export async function createTournament(db: Database, tournament: Tournament)
{
	const { player1_alias, player2_alias, created_by } = tournament;
	const result = await db.run(
		`INSERT INTO tournaments (player1_alias, player2_alias, created_by, created_at)
		VALUES (?, ?, ?, ?)`,
		[player1_alias, player2_alias, created_by, new Date().toISOString()]
	);
	return { id: result.lastID};
}

export async function findTournamentById(db: Database, id: string) {
	return db.get<Tournament>(`SELECT * FROM tournaments WHERE id = ?`, [id]);
}
