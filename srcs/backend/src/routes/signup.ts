import { FastifyInstance } from "fastify";
import bcrypt from 'bcryptjs';

export async function signupRoute(app: FastifyInstance) {
	app.post('/api/signup', async(req, reply) => {
	const { username, email, password } = req.body as {
		username: string;
		email: string;
		password: string;
	};
	console.log("Received signup:", { username, email, password });
	const hashedPassword = await bcrypt.hash(password, 10);

	try {
		await app.db.run(`INSERT INTO users (username, email, hash_password)
			VALUES (?, ?, ?, ?)`,
			[username, email, hashedPassword]
		)
		return reply.status(201).send({ message: 'success' });
	} catch (error: any) {
		console.error('Signup error:', error);
		if (error.code === 'SQLITE_CONSTRAINT') {
			return reply.status(400).send({ message: 'Username or email already exists' });
		}
		return reply.status(500).send({ message: 'Internal server error' });
	}
	})
}
