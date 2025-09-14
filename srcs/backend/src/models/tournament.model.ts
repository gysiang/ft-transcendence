import { Database } from 'sqlite';

export interface Tournament {
	id?: string;
	name: string;
	created_by?: string;
	created_at?: string;
}

export interface ITournamentParams {
  id: string;
}
export async function createTournament(db: Database, t: Pick<Tournament, 'name' | 'created_by'>) {
	const result = await db.run(
	  `INSERT INTO tournaments (name, created_by) VALUES (?, ?)`,
	  [t.name, t.created_by]
	);
	return { id: result.lastID};
  }
export async function findTournamentById(db: Database, id: string) {
	return db.get<Tournament>(`SELECT * FROM tournaments WHERE id = ?`, [id]);
}
