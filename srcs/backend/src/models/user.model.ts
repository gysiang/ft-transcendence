import { Database } from 'sqlite';
import { getTimestamp } from "../utils/time";
import bcrypt from 'bcryptjs';

export interface User {
	id?: number;
	name: string;
	email: string;
	hash_password: string;
}

export async function createUser(db: Database, user: { name: string; email: string; password: string; alias?: string }) {
	const saltRounds = 10;
	const hash = await bcrypt.hash(user.password, saltRounds);
	const date = getTimestamp();

	const result = await db.run(
		`INSERT INTO users (name, email, hash_password, alias, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?)`,
		[user.name, user.email, hash, user.alias ?? null, date, date]
	);

	return { id: result.lastID, name: user.name, email: user.email };
}

export async function findUserByEmail(db: Database, email: string) {
	return db.get<User>(`SELECT * FROM users WHERE email = ?`, [email]);
}
