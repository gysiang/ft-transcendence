import Fastify from 'fastify'
import fastifyCors from '@fastify/cors';
import { FastifyInstance } from 'fastify/types/instance';
import { initializeDatabase } from "./database"
import { authRoutes } from './routes/user.routes';
import { fpSqlitePlugin } from "fastify-sqlite-typed";
import authPlugin from './plugins/auth';
import jwt from '@fastify/jwt';
import dotenv from 'dotenv';
//import cookie from '@fastify/cookie'

const app = Fastify({ logger: true })

const registerPlugins = async (app : FastifyInstance) =>
{
		await app.register(fpSqlitePlugin, {
			dbFilename: "./pong.db",
		})
		/** *
		await app.register(cookie, {
				secret: process.env.COOKE_SECRET,
				hook: 'preHandler'
			}); **/

		await app.register(jwt, {
			secret: process.env.JWT_SECRET!,
			sign: {
				expiresIn: '1 day'
			}
		})
		await app.register(authPlugin);
		await app.register(fastifyCors, {
			origin: 'http://localhost:5173',
			credentials: true
		});
}

const startServer = async () => {
	try {
		dotenv.config({ path: './secrets/.env' });

		await initializeDatabase();
		await registerPlugins(app);
		console.log("Authenticate exists:", typeof app.authenticate);
		await app.register(authRoutes);
		await app.listen({ port: 3000, host: '0.0.0.0' });

		console.log('Server running at http://localhost:3000')
	} catch (err: any) {
		app.log.error(err)
		process.exit(1)
	}
}

startServer();
