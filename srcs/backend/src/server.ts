import Fastify from 'fastify'
import fastifyCors from '@fastify/cors';
import { FastifyInstance } from 'fastify/types/instance';
import { initializeDatabase } from "./database"
import { authRoutes } from './routes/user.routes';
import { fpSqlitePlugin } from "fastify-sqlite-typed";
import authPlugin from './plugins/auth';
import dotenv from 'dotenv';
import fastifyPassport from '@fastify/passport'
import fastifySecureSession from '@fastify/secure-session'
import { VerifyCallback } from 'passport-google-oauth2'
var GoogleStrategy = require('passport-google-oauth2').Strategy;

const app = Fastify({ logger: true })

const registerPlugins = async (app : FastifyInstance) =>
{
		app.register(fpSqlitePlugin, {
			dbFilename: "./pong.db",
		})
		app.register(fastifySecureSession, {
			key: Buffer.from(process.env.SECURESESSION_SECRET!, 'hex'),
			cookie: { path: '/'},
		})
		app.register(fastifyPassport.initialize());
		app.register(fastifyPassport.secureSession());
		fastifyPassport.registerUserDeserializer(async (user, res) => {
			return (user);
		})
		fastifyPassport.registerUserSerializer(async (user, res) => {
			return (user);
		})

		app.register(authPlugin);
		app.register(fastifyCors, {
			origin: 'http://localhost:5173',
			credentials: true
		});
}

const startServer = async () => {
	try {
		dotenv.config({ path: './secrets/.env' });

		await initializeDatabase();
		await registerPlugins(app);
		await app.register(authRoutes);

		fastifyPassport.use('google', new GoogleStrategy({
			clientID:     process.env.GOOGLE_CLIENT_ID,
			clientSecret: process.env.GOOGLE_CLIENT_SECRET,
			callbackURL: "http://localhost:3000/auth/google/callback",
			passReqToCallback   : true
		}, async function (
				request: Request,
				accessToken: string,
				refreshToken: string,
				profile: any,
				done: VerifyCallback
			) {
				try {
				//console.log("Google Profile:", profile);
				done(undefined, profile);
			} catch (err) {
				done(err as Error);
			};
			}
		));
		await app.listen({ port: 3000, host: '0.0.0.0' });

		console.log('Server running at http://localhost:3000')
	} catch (err: any) {
		app.log.error(err)
		process.exit(1)
	}
}

startServer();
