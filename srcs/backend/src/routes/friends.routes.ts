import { FastifyInstance } from 'fastify';
import { getFriendList, newFriend, deleteFriend } from '../controllers/friends.controller';
import { IUserParams} from '../models/user.model';

export async function friendRoutes(app: FastifyInstance) {
	app.post('/api/friend', {preHandler: [app.authenticate]}, newFriend);
	app.delete('/api/friend', {preHandler: [app.authenticate]}, deleteFriend);
	app.get<{ Params: IUserParams}>('/api/friend/:id', {preHandler: [app.authenticate]}, getFriendList);
}
