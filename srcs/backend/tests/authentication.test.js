import { describe, it, expect } from "vitest"
import Fastify from "fastify";
import fp from "fastify-plugin";
import jwt from "jsonwebtoken";
import authPlugin from "../src/plugins/auth";

describe("Authentication plugin", () => {
  it("should return 401 if cookie header is missing", async () => {
		const app = Fastify();
		await app.register(authPlugin);
		app.get("/protected", { preHandler: app.authenticate }, async (req, reply) => {
			return { message: "Access granted" };
		});

		const response = await app.inject({
			method: "GET",
			url: "/protected"
		});
		expect(response.statusCode).toBe(401);
		expect(response.json()).toEqual({ message: "Missing cookies" });
		await app.close();
  });

	it("should return 401 if access token is missing", async () => {
		const app = Fastify();
		await app.register(authPlugin);

		app.get("/protected", { preHandler: app.authenticate }, async (req, reply) => {
			return { message: "Access granted" };
		});

		const response = await app.inject({
			method: "GET",
			url: "/protected",
			headers: {
			cookie: "session_id=12345"
		}
		});

		expect(response.statusCode).toBe(401);
		expect(response.json()).toEqual({ message: "Missing authentication token" });
		await app.close();
  });

  	it("should return 401 if access token is invalid", async () => {
		const app = Fastify();
		await app.register(authPlugin);

		app.get("/protected", { preHandler: app.authenticate }, async (req, reply) => {
			return { message: "Access granted" };
		});

		const response = await app.inject({
			method: "GET",
			url: "/protected",
			headers: {
			cookie: "access_token=helloworld"
		}
		});

		expect(response.statusCode).toBe(401);
		expect(response.json()).toEqual({ message: "Invalid token" });
		await app.close();
  });

	it("should return 401 if access token is expired", async () => {
		process.env.JWT_SECRET = "test_secret";
		const app = Fastify();
		await app.register(authPlugin);

		app.get("/protected", { preHandler: app.authenticate }, async (req, reply) => {
			return { message: "Access granted" };
		});

		const payload = {
			id: '1',
			name: 'Ivan',
			email : 'gysiang@gmail.com',
		}
		const expiredToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: -1 });
		const response = await app.inject({
			method: "GET",
			url: "/protected",
			headers: {
				cookie: `access_token=${expiredToken}`
			}
		});

		expect(response.statusCode).toBe(401);
		expect(response.json()).toEqual({ message: "Invalid token" });
		await app.close();
  });

  	it("should return 200 if access token is valid", async () => {
		process.env.JWT_SECRET = "test_secret";
		const app = Fastify();
		await app.register(authPlugin);

		app.get("/protected", { preHandler: app.authenticate }, async (req, reply) => {
			return { message: "Access granted" };
		});

		const payload = {
			id: '1',
			name: 'Ivan',
			email : 'gysiang@gmail.com',
		}
		const validToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: 1 });
		const response = await app.inject({
			method: "GET",
			url: "/protected",
			headers: {
				cookie: `access_token=${validToken}`
			}
		});

		expect(response.statusCode).toBe(200);
		expect(response.json()).toEqual({ message: "Access granted" });
		await app.close();
  });

    it("should return 401 if JWT_SECRET is invalid", async () => {
		process.env.JWT_SECRET = "test_secret";
		const app = Fastify();
		await app.register(authPlugin);

		app.get("/protected", { preHandler: app.authenticate }, async (req, reply) => {
			return { message: "Access granted" };
		});

		const payload = {
			id: '1',
			name: 'Ivan',
			email : 'gysiang@gmail.com',
		}
		const validToken = jwt.sign(payload, "wrong_secret", { expiresIn: 1 });
		const response = await app.inject({
			method: "GET",
			url: "/protected",
			headers: {
				cookie: `access_token=${validToken}`
			}
		});

		expect(response.statusCode).toBe(401);
		expect(response.json()).toEqual({ message: "Invalid token" });
		await app.close();
  });

      it("should return 401 if payload is tampered", async () => {
		const app = Fastify();
		await app.register(authPlugin);

		app.get("/protected", { preHandler: app.authenticate }, async (req, reply) => {
			return { message: "Access granted" };
		});

		const payload = {
			id : '1',
			name: 'Ivan',
			email : 'gysiang@gmail.com',
		}
		const validToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: 1 });
		const parts = validToken.split(".");
		const header = parts[0];
		const payload1 = parts[1];
		const signature = parts[2];

		const decodedPayload = JSON.parse(
			Buffer.from(payload1, "base64url").toString("utf8")
		);
		decodedPayload.id = 9999;
		const tamperedPayload = Buffer.from(
			JSON.stringify(decodedPayload)
		).toString("base64url");
		const tamperedToken = `${header}.${tamperedPayload}.${signature}`;

		const response = await app.inject({
			method: "GET",
			url: "/protected",
			headers: {
				cookie: `access_token=${tamperedToken}`
			}
		});

		expect(response.statusCode).toBe(401);
		expect(response.json()).toEqual({ message: "Invalid token" });
		await app.close();
  });
});
