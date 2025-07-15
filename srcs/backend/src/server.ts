import Fastify from 'fastify'
import fastifyCors from '@fastify/cors';
import { initializeDatabase } from "./database"

const fastify = Fastify({ logger: true })

const startServer = async () => {
	try {
		const db = await initializeDatabase();

		fastify.register(fastifyCors, {
			origin: 'http://localhost:5173',
			credentials: true
		});

		fastify.get('/api/login', async (req, reply) => {
			console.log("Received login:", req.body);

			const { username, password } = req.body as { username: string; password: string };
		})

		fastify.get('/api/signup', async (req, reply) => {
			console.log("Received login:", req.body);

			const { username, email, password } = req.body as { username: string; email:string, password: string };

		})


		await fastify.listen({ port: 3000, host: '0.0.0.0' });
		console.log('Server running at http://localhost:3000')
	} catch (err) {
		fastify.log.error(err)
		process.exit(1)
	}
}

startServer();
