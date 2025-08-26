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
				hash_password TEXT,
				profile_picture TEXT NOT NULL,
				twofa_enabled BOOLEAN NOT NULL,
				twofa_method TEXT,
				twofa_secret TEXT,
				isLoggedIn BOOLEAN NOT NULL,
				created_at TIMESTAMP NOT NULL,
				updated_at TIMESTAMP NOT NULL
				);

				CREATE TABLE IF NOT EXISTS tournaments (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				player1_alias STRING NOT NULL,
				player2_alias STRING NOT NULL,
				created_by TEXT NOT NULL,
				created_at TIMESTAMP NOT NULL,
				FOREIGN KEY (created_by) REFERENCES users(id)
				);

				CREATE TABLE IF NOT EXISTS matches (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				player1_alias STRING NOT NULL,
				player2_alias STRING,
				player1_score INTEGER NOT NULL,
				player2_score INTEGER NOT NULL,
				winner STRING NOT NULL,
				tournament_id INTEGER NOT NULL,
				created_at TIMESTAMP NOT NULL,
				FOREIGN KEY (tournament_id) REFERENCES tournaments(id)
				);

				CREATE TABLE IF NOT EXISTS friends (
				user_id INTEGER NOT NULL,
				friend_id INTEGER NOT NULL,
				created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
				FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
				FOREIGN KEY (friend_id) REFERENCES users(id) ON DELETE CASCADE,
				PRIMARY KEY (user_id, friend_id)
				);

			`);
			// sample seed data
			/** *
			await db.exec(`
				INSERT INTO tournaments (player1_alias, player2_alias, created_by, created_at)
				VALUES
					('Alice', 'Bob', 1, CURRENT_TIMESTAMP),
					('Charlie', 'Alice', 3, CURRENT_TIMESTAMP),
					('Test1', 'Test2', 1, CURRENT_TIMESTAMP);

				INSERT INTO matches (player1_alias, player2_alias, player1_score, player2_score, winner, tournament_id, created_at)
				VALUES
					('Alice', 'Bob', 10, 8, 'Alice', 1, CURRENT_TIMESTAMP),
					('Bob', 'Alice', 7, 11, 'Alice', 1, CURRENT_TIMESTAMP),
					('Charlie', 'Alice', 9, 12, 'Alice', 2, CURRENT_TIMESTAMP),
					('Test1', 'Test2', 10, 11, 'Test2', 3, CURRENT_TIMESTAMP);
				`);
			**/
			console.log('SQLite database initialized and table created.');
			return (db);
			} catch (error) {
			console.error('Error initializing database:', error);
		}
}
