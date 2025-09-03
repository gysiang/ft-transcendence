import { Database } from 'sqlite';
import { findUserByEmail } from './user.model';

export interface Friend {
	user_id: string,
	friend_id: string,
}

export interface IFriendParams {
  id: string;
}

export async function addFriend(db: Database, friend: Friend)
{
	const { user_id, friend_id } = friend;
	await db.run(
	`INSERT OR IGNORE INTO friends (user_id, friend_id) VALUES (?, ?)`,
	[user_id, friend_id]
	);
	await db.run(
	`INSERT OR IGNORE INTO friends (user_id, friend_id) VALUES (?, ?)`,
	[friend_id, user_id]
	);
}

export async function removeFriend(db: Database, friend: Friend)
{
	const { user_id, friend_id } = friend;
	await db.run(`DELETE FROM friends WHERE user_id = ? AND friend_id = ?`,
		[user_id, friend_id]
	);
	await db.run(`DELETE FROM friends WHERE user_id = ? AND friend_id = ?`,
		[friend_id, user_id]
	);
}

export async function isFriendAdded(db: Database, user_id: string, friend_email: string) {
	const row = await db.get(
		`SELECT 1
		 FROM friends f
		 JOIN users u ON f.friend_id = u.id
		 WHERE f.user_id = ? AND u.email = ?
		 LIMIT 1`,
		[user_id, friend_email]
	);
	if (row) {
		return (true);
	} else {
		return (false);
	}
}

export async function getFriends(db: Database, user_id: string)
{
	const result = await db.all(
	`SELECT u.id, u.name, u.email, u.isLoggedIn
	FROM friends f
	JOIN users u ON f.friend_id = u.id
	WHERE f.user_id = ?`,
	[user_id]
	);
	return (result)
}
