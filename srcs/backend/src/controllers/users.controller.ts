import { FastifyReply, FastifyRequest } from 'fastify';
import { IUserParams, IUserBody, IProfileBody, createUser, findUserByEmail, findUserById, updateProfilePic, update2faMethod, updateOnlySecret, updateUserStatus, disable2FA } from '../models/user.model';
import bcrypt from 'bcryptjs';
const jwt = require('jsonwebtoken');
const cookie = require("cookie");
import { serialize } from 'cookie';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { createS3Client } from '../services/s3';
import { processEmailInput, processUsername, check2faToken } from '../utils/helper'
import nodemailer from 'nodemailer'
import speakeasy from 'speakeasy';

export async function loginUser(req: FastifyRequest, reply: FastifyReply) {
	try {
			const { email , password } = req.body as
			{
				email: string;
				password: string;
			}

	let sanemail = processEmailInput(email);

	const db = req.server.db;
	const user = await findUserByEmail(db, sanemail);
	if (!user) {
		return reply.status(401).send({ message: "Invalid email" });
	}
	if (!user.hash_password) {
		return reply.status(401).send({ message: 'Password not set for this user' });
	}
	const verifyPassword = await bcrypt.compare(password, user.hash_password);
	if (!verifyPassword) {
		return reply.status(401).send({ message: 'Invalid password' });
	}
	if (user.twofa_enabled == true) {
		if (user.twofa_secret && user.twofa_method == "email") {
			let code = speakeasy.totp({
				secret: user.twofa_secret,
				encoding: 'base32'
			});
			sendEmailCode(user.email, code);
		}
		return reply
			.status(200)
			.send({ message: 'stage-2fa',
					id: user.id,
					twofa_method: user.twofa_method
			 });
	}

	if (!user.id) {
		return reply.status(401).send({ message: "User not found" });
	}
	await updateUserStatus(db, user.id, true);

	const payload = {
		id: user.id,
		name: user.name,
		email : user.email,
	}
	const token = jwt.sign(payload, process.env.JWT_SECRET);
	const cookieStr = cookie.serialize('access_token', token, {
		httpOnly: true,
		maxAge: 60 * 60 * 1,
		path: '/'
	});
	return (reply.header('Set-Cookie', cookieStr)
				.status(200)
				.send({
					message: 'success',
					id: user.id,
				}))
	} catch (err: any) {
		req.log.error(err);
		return reply.status(500).send({ message: 'Internal Server Error' });
	}
}

export async function signupUser(req: FastifyRequest, reply: FastifyReply) {
	try {
			const { name, email, password } = req.body as
			{
				name: string;
				email: string;
				password: string;
			};

	let sanename = processUsername(name);
	let sanemail = processEmailInput(email);

	const db = req.server.db;
	const existing = await findUserByEmail(db, sanemail);
	if (existing) {
		return reply.status(400).send({ message: 'Email already exists' });
	}
	const profile_picture = process.env.PRODUCTION_URL + '/default-profile.jpg';
	const user = await createUser(db, { name: sanename, email: sanemail, password, profile_picture });

	const payload = {
		id: user.id,
		name: user.name,
		email : user.email,
	}
	const token = jwt.sign(payload, process.env.JWT_SECRET);

	const cookieStr = cookie.serialize('access_token', token, {
		httpOnly: true,
		maxAge: 60 * 60 * 24,
		path: '/'
	});

	await updateUserStatus(db, String(user.id), true);

	return (reply
			.header('Set-Cookie', cookieStr)
			.status(201)
			.send({
				message: 'success',
				id: user.id,
			}));
	} catch (err : any) {
	req.log.error(err);
	return reply.status(500).send({ message: 'Internal Server Error' });
	}
}

export async function googleSignIn(req: FastifyRequest, reply: FastifyReply) {

	try {
		const db = req.server.db;
		//const frontend = process.env.FRONTEND_URL;
		const production = process.env.PRODUCTION_URL;
		const password = null;
		const user = req.user as any;
		const name = user._json?.name;
		const email = user._json?.email;
		const profile_picture = process.env.PRODUCTION_URL + '/default-profile.jpg';

		if (!name || !email) {
			return reply.status(400).send({ message: 'Missing name or email from Google profile' });
		}

		const existing = await findUserByEmail(db, email);

		let profile;
		if (!existing) {
			profile = await createUser(db, { name, email, password, profile_picture });
		} else {
			 profile = existing;
		}

		const payload = {
			id: profile.id,
			name: profile.name,
			email : profile.email,
		}

		const token = jwt.sign(payload, process.env.JWT_SECRET);

		const cookieStr = cookie.serialize('access_token', token, {
			httpOnly: true,
			maxAge: 60 * 60 * 24,
			path: '/'
		});
		await updateUserStatus(db, String(profile.id), true);

		return (reply
				.header('Set-Cookie', cookieStr)
				.redirect(production + '/?userId=' + profile.id)
			);
	} catch (err : any) {
	req.log.error(err);
	return reply.status(500).send({ message: 'Internal Server Error' });
	}
}

export async function getUser(req: FastifyRequest<{Params: IUserParams}>, reply: FastifyReply) {

	try {
		const { id } = req.params;

		if (!id) {
			return reply.status(400).send({ message: "id is required" });
		}

		if (req.userData?.id != id) {
			return reply.status(400).send({ message: "Forbidden" });
		}

		const db = req.server.db;
		const user = await findUserById(db, id);
		if (!user) {
			return reply.status(401).send({ message: "Invalid email" });
		}
		return (reply
				.status(200)
				.send({
					message: "Authentication success",
					id: user.id,
					name: user.name,
					email: user.email,
					profile_picture: user.profile_picture,
					twofa_method: user.twofa_method,
				}));
		} catch (err: any) {
		req.log.error(err);
		return reply.status(500).send({ message: 'Internal Server Error' });
	}
}

export async function logoutUser(req: FastifyRequest, reply: FastifyReply) {
	try {
		const { id } = req.body as
		{
			id: string;
		}
		if (!id)
			return reply.status(401).send({ message: "id is required" });
		const db = req.server.db;
		const user = await findUserById(db, id);
		if (!user) {
			return reply.status(400).send({ error: 'User not found' });
		}
		await updateUserStatus(db, id, false);

		reply.header('Set-Cookie', serialize('access_token', '', {
			httpOnly: true,
			maxAge: 0,
			path: '/'
		}))
			.send({
				message: "Logout successful",
			})
	} catch (err: any) {
		req.log.error(err);
		return reply.status(500).send({ message: 'Internal Server Error' });
	}
};


export async function editUser(req: FastifyRequest<{ Params: IUserParams; Body: IUserBody;}>, reply: FastifyReply) {
	try {
		const { id } = req.params;
		const { name, email } = req.body;
		const db = req.server.db;

		if (req.userData?.id != id) {
			return reply.status(400).send({ message: "Forbidden" });
		}

		let sanename = processUsername(name);
		let sanemail = processEmailInput(email);

		await db.run(
			`UPDATE users SET name = ?, email = ?, updated_at = ? WHERE id = ?`,
			[sanename, sanemail, new Date().toISOString(), id]
		);
		reply.status(200)
			 .send({
				message: 'User updated successfully',
			  });
	} catch (err: any) {
		req.log.error(err);
		return reply.status(500).send({ message: 'Internal Server Error' });
	}
}

export async function editPicture(req: FastifyRequest<{
	Params: IUserParams;
}>, reply: FastifyReply) {

	const { id } = req.params;

	try {
	if (req.userData?.id != id) {
		return reply.status(400).send({ message: "Forbidden" });
	}
	const db = req.server.db;
	const s3 = createS3Client();
	const data = await req.file();
	if (!data) {
		return reply.status(400).send({ message: 'No file uploaded' });
	}

	const putObjectCommand = new PutObjectCommand({
		Bucket: process.env.AWS_BUCKET,
		Key: `${id}/${data.filename}`,
		Body: await data.toBuffer(),
		ContentType: data.mimetype,
		ACL: "public-read"
	});

	await s3.send(putObjectCommand);
	const imageUrl = `https://${process.env.AWS_BUCKET}.s3.amazonaws.com/${id}/${data.filename}`;
	console.log("profile img:", imageUrl);
	await updateProfilePic(db, id, imageUrl);

	reply.status(200)
			 .send({
				message: 'success',
				image: imageUrl
			  });
	} catch (err: any) {
		req.log.error(err);
		return reply.status(500).send({ message: 'Internal Server Error' });
	}
}

export async function setUp2fa(req: FastifyRequest, reply: FastifyReply) {
	const { id } = req.body as
	{
		id: string;
	}
	if (!id)
		return reply.status(401).send({ message: "id is required" });
	if (req.userData?.id != id) {
		return reply.status(400).send({ message: "Forbidden" });
	}
	try {
		const db = req.server.db;
		const user = await findUserById(db, id);
		if (!user)
			return reply.status(401).send({ message: "User does not exist" });
		let secret = speakeasy.generateSecret({
			name: "Pong42",
		});
		updateOnlySecret(db, id, secret.base32);
		reply.status(200).send({
			message: "2fa setup success",
			otpauth_url: secret.otpauth_url,
			base32: secret.base32,
		})
	} catch (err: any) {
		req.log.error(err);
		return reply.status(500).send({ message: 'Internal Server Error' });
	}
}


export async function verify2fa(req: FastifyRequest, reply: FastifyReply) {

	const { id, token, twofa_method } = req.body as
	{
		id: string;
		token: string;
		twofa_method: string
	};
	if (!id)
		return reply.status(401).send({ message: "id is required" });
	if (!token)
		return reply.status(401).send({ message: "token is required" });
	if (!twofa_method)
		return reply.status(401).send({ message: "twofa_method is required" });
	if (!check2faToken(token))
		return reply.status(401).send({ message: "token is not 6 digits" });
	try {
	const db = req.server.db;
	const user = await findUserById(db, id);
	if (!user) {
		return reply.status(400).send({ error: 'User not found' });
	}
	if (!user?.twofa_secret) {
		return reply.status(400).send({ error: '2FA not set up for this user' });
	}
	const verified = speakeasy.totp.verify({
		secret: user.twofa_secret,
		encoding: 'base32',
		token,
		window: 1,
	})

	if (!verified)
		return reply.status(401).send({ message: 'Invalid 2FA token' });
	if (!user.isLoggedIn && user.id)
		await updateUserStatus(db, user.id, true);

	await update2faMethod(db, id, twofa_method);

	const payload = {
		id: user.id,
		name: user.name,
		email : user.email,
	}
	const fulltoken = jwt.sign(payload, process.env.JWT_SECRET);
	const cookieStr = cookie.serialize('access_token', fulltoken, {
		httpOnly: true,
		maxAge: 60 * 60 * 1,
		path: '/'
	});

	return (reply.status(200)
	.header('Set-Cookie', cookieStr)
	.send({
		message: "2fa verified login success",
		id: user.id
	}));
	} catch (err: any) {
		req.log.error(err);
		return reply.status(500).send({ message: 'Internal Server Error' });
	}
}

export async function get2faStatus(req: FastifyRequest, reply: FastifyReply) {
	// const { id } = req.body as
	// {
	// 	id: string;
	// }
	// if (!id)
	// 	return reply.status(401).send({ message: "id is required" });
	// if (req.userData?.id != id)
	// 	return reply.status(400).send({ message: "Forbidden" });
    try {
		const userId = req.userData?.id;
        	if (!userId) return reply.status(401).send({ message: "Unauthenticated" });
		
        const db = req.server.db;
        const user = await db.get(`SELECT twofa_enabled, twofa_method FROM users WHERE id = ?`, [userId]);
        if (!user) return reply.status(404).send({ message: "User not found" });

        reply.status(200).send({
            twofa_enabled: !!user.twofa_enabled, // convert 0/1 to boolean
            twofa_method: user.twofa_method
        });
    } catch (err: any) {
        req.log.error(err);
        reply.status(500).send({ message: "Internal Server Error" });
    }
}

async function sendEmailCode(userEmail: string, code: string) {

	const transporter = nodemailer.createTransport({
	service: 'gmail',
	auth: {
		user: process.env.GMAIL_USER,
		pass: process.env.GMAIL_PASS,
	},
	});
	await transporter.sendMail({
	from: `"Pong 42" <${process.env.GMAIL_USER}>`,
	to: userEmail,
	subject: "Your 2FA Code",
	text: `Your login verification code is: ${code}`,
	});
}

export async function setUpEmail2FA(req: FastifyRequest, reply: FastifyReply) {
	const { id } = req.body as
	{
		id: string;
	}
	if (!id)
		return reply.status(401).send({ message: "id is required" });
	if (req.userData?.id != id) {
		return reply.status(400).send({ message: "Forbidden" });
	}
	try {
	const db = req.server.db;
	const user = await findUserById(db, id);
	if (!user)
		return reply.status(401).send({ message: "User does not exist" });

	let secret = speakeasy.generateSecret({
		 name: "Pong42",
	});
	let code = speakeasy.totp({
		secret: secret.base32,
		encoding: 'base32'
	});

	await updateOnlySecret(db, id, secret.base32);
	sendEmailCode(user.email, code);

	reply.status(200).send({
		message: "2fa via Email setup success, please check email",
	})
	} catch (err: any) {
		req.log.error(err);
		return reply.status(500).send({ message: 'Internal Server Error' });
	}
}


export async function turnOff2FA(req: FastifyRequest, reply: FastifyReply) {

	try {
	const { id } = req.body as
	{
		id: string;
	};
	if (!id)
		return reply.status(401).send({ message: "id is required" });
	if (req.userData?.id != id) {
		return reply.status(400).send({ message: "Forbidden" });
	}
	const db = req.server.db;
	const user = await findUserById(db, id);
	if (!user) {
		return reply.status(400).send({ error: 'User not found' });
	}
	await disable2FA(db, id);
	reply.status(200).send({
		message: "2fa disabled",
	})
	} catch (err: any) {
		req.log.error(err);
		return reply.status(500).send({ message: 'Internal Server Error' });
	}
}
