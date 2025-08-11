import { Database } from 'sqlite';
import { getTimestamp } from "../utils/time";
import bcrypt from 'bcryptjs';

export interface User {
	id?: string;
	name: string;
	email: string;
	hash_password: string | null;
	profile_picture: string;
}

export interface IUserParams {
  id: string;
}

export interface IUserBody {
  name: string;
  email: string;
}

export interface IProfileBody {
	profile_picture : File;
}

export async function createUser(db: Database, user: { name: string; email: string; password?: string | null; profile_picture: string }) {
	const saltRounds = 10;
	const hash = user.password ? await bcrypt.hash(user.password, saltRounds) : null;
	const date = getTimestamp();

	const result = await db.run(
		`INSERT INTO users (name, email, hash_password, profile_picture, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?, ?)`,
		[user.name, user.email, hash, user.profile_picture, date, date]
	);

	return { id: result.lastID, name: user.name, email: user.email, profile_picture: user.profile_picture };
}

export async function findUserByEmail(db: Database, email: string) {
	return db.get<User>(`SELECT * FROM users WHERE email = ?`, [email]);
}

export async function findUserById(db: Database, id: string) {
	return db.get<User>(`SELECT * FROM users WHERE id = ?`, [id]);
}

export async function updateProfilePic(db: Database, id: string, profile: string){
	const date = getTimestamp();
	const result = await db.run(
	`UPDATE users
	SET profile_picture = ?, updated_at = ?
	WHERE id = ?`,
	[profile, date, id]
	);
	return (result);
}
