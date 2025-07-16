import { FastifyInstance } from 'fastify';
import bcrypt from 'bcryptjs';

export async function loginRoute(app: FastifyInstance)
{
	app.post('/api/login', async (req, reply) => {
	const { username, password } = req.body as {
		username: string;
		password: string;
	};
	console.log("Received login:", { username, password });

	const user = await app.db.get(
		`SELECT * FROM users WHERE username = ?`,
		[username]
	);
	if (!user) {
		return reply.status(401).send({ message: 'Invalid username' });
	}

	const verifyPassword = bcrypt.compare(password, user.hash_password);
	if (!verifyPassword) {
		reply.status(401).send({ message: 'Invalid password' });
	}

	const payload = {
		id: user.id,
		username : user.username,
	}

	const token = app.jwt.sign(payload);
	if (!token) {
		reply.status(500).send({ message: 'JWT Error' });
	}

	return reply.status(200).send({
		message: 'success',
		username: user.username,
		email: user.email,
		token: token
		})
	})
}
