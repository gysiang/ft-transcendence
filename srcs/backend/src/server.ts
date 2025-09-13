import Fastify from 'fastify'
import addFormats from 'ajv-formats';
import ajvErrors from 'ajv-errors';
import fastifyCors from '@fastify/cors';
import websocket from '@fastify/websocket';
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
import type { RawData, WebSocket as WSSocket } from 'ws';
import { joinRoom, leaveRoom, leaveAll, broadcast } from './rooms';
import { enqueue } from './onlineTourn';
import { createTournament,getByCode, tournaments } from './realtimeTournament';

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
			origin: process.env.FRONTEND_URL,
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
		app.register(websocket);

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
		app.get('/ws', { websocket: true }, (conn, req) => {
			// compatible with both handler shapes
			const raw = conn as any;
			const socket: WSSocket = (raw && raw.socket) ? (raw.socket as WSSocket) : (raw as WSSocket);
			
			let myTournamentId: string | null = null;
			let myPlayerId: string | null = null;
			// greet
			setTimeout(() => {
			  if (socket.readyState === socket.OPEN) {
				socket.send(JSON.stringify({ type: 'hello', ts: Date.now() }));
			  }
			}, 0);
		  
			socket.on('message', (data: RawData) => {
			  const text = typeof data === 'string' ? data : data.toString();
			  let msg: any; try { msg = JSON.parse(text); } catch { return; }
		  
			  switch (msg?.type) {
				case 'ping':
				  socket.send(JSON.stringify({ type: 'pong', ts: Date.now() }));
				  break;
		  
				case 'queue':
				  // enqueue this socket; pass goalLimit if you want it customizable
				  enqueue(socket, typeof msg.goalLimit === 'number' ? msg.goalLimit : 5);
				  // (optional) ack
				  socket.send(JSON.stringify({ type: 'queued' }));
				  break;
				  case 't.create': {
					const name = String(msg.name ?? 'Tournament');
					const goalLimit = Number(msg.goalLimit ?? 5);
					const maxPlayers = Math.min(8, Math.max(2, Number(msg.maxPlayers ?? 8)));
					const alias = String(msg.alias ?? 'Host');
			
					const t = createTournament({ name, goalLimit, maxPlayers });
					const pid = t.addPlayer(socket, alias);
					t.setHost(pid);
			
					myTournamentId = t.id;
					myPlayerId = pid;
			
					socket.send(JSON.stringify({ type: 't.created', id: t.id, code: t.code }));
					// t.addPlayer already broadcasted t.state to lobby
					break;
				  }
			
				  // Anyone joins by code
				  case 't.join': {
					const code = String(msg.code ?? '');
					const alias = String(msg.alias ?? 'Player');
					const t = getByCode(code);
					if (!t) {
					  socket.send(JSON.stringify({ type: 't.error', msg: 'Invalid code' }));
					  break;
					}
					const pid = t.addPlayer(socket, alias);
					myTournamentId = t.id;
					myPlayerId = pid;
			
					socket.send(JSON.stringify({ type: 't.joined', id: t.id, pid }));
					// t.addPlayer already broadcasted t.state
					break;
				  }
			
				  // Player toggles ready
				  case 't.ready': {
					if (!myTournamentId || !myPlayerId) break;
					const t = tournaments.get(myTournamentId);
					if (!t) break;
					t.markReady(myPlayerId, !!msg.ready);
					break;
				  }
			
				  // Host starts tournament
				  case 't.start': {
					if (!myTournamentId || !myPlayerId) break;
					const t = tournaments.get(myTournamentId);
					if (!t) break;
					if (t.host !== myPlayerId) {
					  socket.send(JSON.stringify({ type: 't.error', msg: 'Only host can start' }));
					  break;
					}
					t.start();
					break;
				  }
			
				  default:
					// Ignore unknown; match inputs are handled by the match loop
					break;
				}
			  });
		  
			const hb = setInterval(() => {
			  if (socket.readyState === socket.OPEN) socket.ping();
			}, 30_000);
			socket.on('close', () => clearInterval(hb));
		  });
		await app.listen({ port: 3000, host: '0.0.0.0' });

		console.log('Server running at http://localhost:3000')
	} catch (err: any) {
		app.log.error(err)
		process.exit(1)
	}
}

startServer();
