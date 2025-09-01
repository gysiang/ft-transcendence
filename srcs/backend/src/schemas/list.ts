import { FastifyInstance } from "fastify";
import { AliasPattern, IdString } from "./common";
import { TournamentSchema, MatchSchema } from "./tournament";
import { SignupSchema } from "./signup";
import { LoginSchema } from "./login";

export function registerSchemas(app: FastifyInstance) {
    app.addSchema(AliasPattern);
    app.addSchema(IdString);
    app.addSchema(TournamentSchema);
    app.addSchema(MatchSchema);
    app.addSchema(SignupSchema);
    app.addSchema(LoginSchema);
    app.log.info({ ids: Object.keys(app.getSchemas?.() || {}) }, 'schemas-registered');
  }