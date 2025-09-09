import Fastify from 'fastify'
import addFormats from 'ajv-formats';
import ajvErrors from 'ajv-errors';
import fastifyCors from '@fastify/cors';
import dotenv from 'dotenv';
import { FastifyInstance } from 'fastify/types/instance';
import { initializeDatabase } from "./database"
import { authRoutes } from './routes/user.routes';
import { gameRoutes } from './routes/tournament.routes'
import { friendRoutes } from './routes/friends.routes';
import { fpSqlitePlugin } from "fastify-sqlite-typed";
import authPlugin from './plugins/auth';
import FastifyMultipart from '@fastify/multipart'
import fastifyPassport from '@fastify/passport'
import fastifySecureSession from '@fastify/secure-session'
import { VerifyCallback } from 'passport-google-oauth2'
import { registerSchemas } from './schemas/list';

var GoogleStrategy = require('passport-google-oauth2').Strategy;

const app = Fastify({ logger: true,ajv: {
    customOptions: { allErrors: true },
    plugins: [addFormats, ajvErrors],}, })
  app.setSchemaErrorFormatter((errors, _dataVar) => {
	const e = errors[0];
	const msg = e?.message || 'Invalid request';
	const err: any = new Error(msg); // no "body/name" prefix
	err.statusCode = 400;
	return err;
  });

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
			origin: ['http://localhost:5173', 'http://localhost:8080'],
			methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
			credentials: true
		});

		app.register(FastifyMultipart, {
		limits: {
			fields: 1,         // Max number of non-file fields
			fileSize: 40000,  // For multipart forms, the max file size in bytes
			files: 1,           // Max number of file fields
			headerPairs: 1,  // Max number of header key=>value pairs
		}})

}

const startServer = async () => {
	try {
		dotenv.config({ path: './secrets/.env' });

		await initializeDatabase();
		await registerPlugins(app);
		registerSchemas(app);
		await app.register(authRoutes);
		await app.register(gameRoutes);
		await app.register(friendRoutes);

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
