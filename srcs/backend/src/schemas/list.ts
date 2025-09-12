import { FastifyInstance } from "fastify";
import { AliasPattern, IdString } from "./common";
import { TournamentSchema, MatchSchema } from "./tournament";
import { SignupSchema } from "./signup";
import { LoginSchema } from "./login";
import { EditUserSchema } from "./edituser";
import { AddFriendSchema, DeleteFriendSchema } from "./friend";

export function registerSchemas(app: FastifyInstance) {
    app.addSchema(AliasPattern);
    app.addSchema(IdString);
    app.addSchema(TournamentSchema);
    app.addSchema(MatchSchema);
    app.addSchema(SignupSchema);
    app.addSchema(LoginSchema);
	app.addSchema(EditUserSchema);
	app.addSchema(AddFriendSchema);
	app.addSchema(DeleteFriendSchema);
    app.log.info({ ids: Object.keys(app.getSchemas?.() || {}) }, 'schemas-registered');
  }
