import { Database } from 'sqlite';
import bcrypt from 'bcryptjs';

export interface User {
	id?: number;
	username: string;
	email: string;
	hash_password: string;
}

export async function createUser(db: Database, user: { username: string; email: string; password: string }) {
	const saltRounds = 10;
	const hash = await bcrypt.hash(user.password, saltRounds);

	const result = await db.run(
		`INSERT INTO users (username, email, hash_password)
		VALUES (?, ?, ?)`,
		[user.username, user.email, hash]
	);

	return { id: result.lastID, username: user.username, email: user.email };
}

export async function findUserByUsername(db: Database, username: string) {
	return db.get<User>(`SELECT * FROM users WHERE username = ?`, [username]);
}

export async function findUserByEmail(db: Database, email: string) {
	return db.get<User>(`SELECT * FROM users WHERE email = ?`, [email]);
}
