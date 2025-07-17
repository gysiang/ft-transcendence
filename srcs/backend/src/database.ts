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
				username TEXT NOT NULL,
				email TEXT NOT NULL UNIQUE,
				hash_password TEXT NOT NULL
				);
			`);

			console.log('SQLite database initialized and table created.');
			return (db);
			} catch (error) {
			console.error('Error initializing database:', error);
		}
}
