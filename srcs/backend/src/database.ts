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
				id	INTEGER PRIMARY KEY AUTOINCREMENT,
				name	TEXT NOT NULL,
				created_by  INTEGER NOT NULL,
				created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
				FOREIGN KEY (created_by) REFERENCES users(id)
				);
				CREATE TABLE matches (
				id	INTEGER PRIMARY KEY AUTOINCREMENT,
				tournament_id	INTEGER NOT NULL,
				player1_id	INTEGER,    
				player2_id	INTEGER,
				player1_alias   TEXT NOT NULL,
				player2_alias   TEXT,
				player1_score   INTEGER NOT NULL,
				player2_score   INTEGER NOT NULL,
				winner_id       INTEGER,
				winner_alias    TEXT,
				created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
				FOREIGN KEY (tournament_id) REFERENCES tournaments(id),
				FOREIGN KEY (player1_id) REFERENCES users(id),
				FOREIGN KEY (player2_id) REFERENCES users(id),
				FOREIGN KEY (winner_id)  REFERENCES users(id),
				CHECK (player1_score >= 0 AND player2_score >= 0)
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
			// sample seed data*
			/*
			await db.exec(`
			INSERT INTO tournaments (name, created_by) VALUES
    		('Alice vs Bob Test',        1),
    		('Charlie vs Alice Test',    3),
    		('Test Cup 3',               1);

  			-- matches (IDs optional; aliases always kept)
  			INSERT INTO matches (
    		tournament_id, player1_id, player2_id,
    		player1_alias, player2_alias,
    		player1_score, player2_score,
    		winner_id, winner_alias
  			) VALUES
    		(1, 1, 2, 'Alice',  'Bob',     10,  8,  1,   ALICE),
    		(1, 2, 1, 'Bob',    'Alice',    7, 11,  1,   ALICE),
    		(2, 3, 1, 'Charlie','Alice',    9, 12,  1,   ALICE),
    		(3, NULL, NULL, 'Test1','Test2',10, 11, NULL,'Test2');  -- guest winner example`);
			*/
			console.log('SQLite database initialized and table created.');
			return (db);
			} catch (error) {
			console.error('Error initializing database:', error);
		}
}
