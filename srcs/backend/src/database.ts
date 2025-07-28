import sqlite3 from 'sqlite3';
import { open } from 'sqlite';


export async function initializeDatabase() {

	try {
		const db = await open({
				filename: './pong.db',
				driver: sqlite3.Database,
				});

			await db.exec(`
				CREATE TABLE IF NOT EXISTS users (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				name TEXT NOT NULL,
				email TEXT NOT NULL UNIQUE,
				hash_password TEXT NOT NULL,
				profile_picture TEXT NOT NULL,
				created_at TIMESTAMP NOT NULL,
				updated_at TIMESTAMP NOT NULL
				);

				CREATE TABLE IF NOT EXISTS tournaments (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				created_by INTEGER NOT NULL,
				created_at TIMESTAMP NOT NULL,
				FOREIGN KEY (created_by) REFERENCES users(id)
				);

				CREATE TABLE IF NOT EXISTS matches (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				player1_id INTEGER NOT NULL,
				player2_id INTEGER,
				player1_score INTEGER NOT NULL,
				player2_score INTEGER NOT NULL,
				winner_id INTEGER NOT NULL,
				is_bot BOOLEAN NOT NULL,
				tournament_id INTEGER NOT NULL,
				created_at TIMESTAMP NOT NULL,
				FOREIGN KEY (player1_id) REFERENCES users(id),
				FOREIGN KEY (player2_id) REFERENCES users(id),
				FOREIGN KEY (winner_id) REFERENCES users(id),
				FOREIGN KEY (tournament_id) REFERENCES tournaments(id)
				);

				CREATE TABLE IF NOT EXISTS tournament_entries (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				tournament_id INTEGER NOT NULL,
				user_id INTEGER NOT NULL,
				joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
				UNIQUE (tournament_id, user_id),
				FOREIGN KEY (tournament_id) REFERENCES tournaments(id),
				FOREIGN KEY (user_id) REFERENCES users(id)
				);
			`);

			console.log('SQLite database initialized and table created.');
			return (db);
			} catch (error) {
			console.error('Error initializing database:', error);
		}
}
