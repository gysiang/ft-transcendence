import Fastify from 'fastify'
import fastifyCors from '@fastify/cors';
import { initializeDatabase } from "./database"
import { loginRoute } from './routes/login';
import { signupRoute } from './routes/signup';
import { fpSqlitePlugin } from "fastify-sqlite-typed";
import jwt from '@fastify/jwt';
import dotenv from 'dotenv';
import path from 'path';

const app = Fastify({ logger: true })

const startServer = async () => {
	try {
		dotenv.config({ path: './secrets/.env' });

		await initializeDatabase();

		app.register(fpSqlitePlugin, {
			dbFilename: "./pong.db",
		})
		app.register(jwt, {
			secret: process.env.JWT_SECRET!
		})
		//console.log('JWT secret:', process.env.JWT_SECRET);

		app.register(fastifyCors, {
			origin: 'http://localhost:5173',
			credentials: true
		});

		await app.register(loginRoute);
		await app.register(signupRoute);
		await app.listen({ port: 3000, host: '0.0.0.0' });

		console.log('Server running at http://localhost:3000')
	} catch (err: any) {
		app.log.error(err)
		process.exit(1)
	}
}

startServer();
