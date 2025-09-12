import { FastifyInstance } from 'fastify';
import { getFriendList, newFriend, deleteFriend } from '../controllers/friends.controller';
import { IUserParams} from '../models/user.model';
import { AddFriendSchema, DeleteFriendSchema } from '../schemas/friend';

export async function friendRoutes(app: FastifyInstance) {
	app.post('/api/friend', {schema: {body:{ $ref:'AddFriendSchema#' }}, preHandler: [app.authenticate]}, newFriend);
	app.delete('/api/friend', {schema: {body:{ $ref:'DeleteFriendSchema#' }}, preHandler: [app.authenticate]}, deleteFriend);
	app.get<{ Params: IUserParams}>('/api/friend/:id', {schema: { params: { $ref: 'IdString#' }}, preHandler: [app.authenticate]}, getFriendList);
}
