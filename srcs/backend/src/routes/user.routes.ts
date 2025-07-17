import { FastifyInstance } from 'fastify';
import { signupController, loginController } from '../controllers/users.controller';

export async function authRoutes(app: FastifyInstance) {
  app.post('/api/signup', signupController);
  app.post('/api/login', loginController);
}