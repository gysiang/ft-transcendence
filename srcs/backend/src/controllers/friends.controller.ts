import { FastifyReply, FastifyRequest } from 'fastify';
import { addFriend, removeFriend, getFriends, Friend } from '../models/friend.model';
import { IFriendParams } from '../models/friend.model';
import { findUserByEmail, findUserById, User } from '../models/user.model';
import { IUserParams } from '../models/user.model';

export async function newFriend(req: FastifyRequest, reply: FastifyReply) {

	try{
		const { user_id, friend_email } = req.body as
		{
			user_id: string;
			friend_email: string;
		};
		const db = req.server.db;
		const newFriend = await findUserByEmail(db, friend_email);
		if (!newFriend)
			return reply.status(401).send({ message: "Invalid email" });
		if (!newFriend.id)
			return reply.status(401).send({ message: "Friend id not found" });
		await addFriend(db, {user_id, friend_id: newFriend.id});
		reply
			.status(200)
			.send({
				message: "New Friend Added",
			});

	} catch (err : any) {
	req.log.error(err);
	return reply.status(500).send({ message: 'Internal Server Error' });
	}
}

export async function deleteFriend(req: FastifyRequest, reply: FastifyReply) {

	try{
		const { user_id, friend_id } = req.body as
		{
			user_id: string;
			friend_id: string;
		};
		const db = req.server.db;
		const friend = findUserById(db, friend_id);
		if (!friend)
			return reply.status(401).send({ message: "Friend id not found" });
		await removeFriend(db, {user_id, friend_id});
		reply
			.status(200)
			.send({
					message: "Friend Removed",
				});
	} catch (err : any) {
	req.log.error(err);
	return reply.status(500).send({ message: 'Internal Server Error' });
	}
}


export async function getFriendList(req: FastifyRequest<{Params: IUserParams}>, reply: FastifyReply) {

	try {
		const { id } = req.params;

		if (!id) {
			return reply.status(400).send({ message: "id is required" });
		}
		const db = req.server.db;
		const friendlist = await getFriends(db, id);
		reply
			.status(200)
			.send({
					message: "Friendlist success",
					friendlist: friendlist
				});
	} catch (err : any) {
	req.log.error(err);
	return reply.status(500).send({ message: 'Internal Server Error' });
	}
}
