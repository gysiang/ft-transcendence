export const TournamentSchema = {
    $id: 'TournamentSchema',
    type: 'object',
    required: ['name'],
    additionalProperties: false,
    properties: {
      name:{type:'string',minLength: 1, maxLength: 32}
    },
  } as const;

  export const MatchSchema = {
    $id: 'MatchSchema',
    type: 'object',
    required: ['player1_alias', 'player2_alias','player1_score', 'player2_score',
      'winner_alias', 'tournament_id'],
    additionalProperties: false,
    properties: {
      player1_alias: { $ref: 'Alias#' },
      player2_alias: { $ref: 'Alias#' },
      player1_score: { type: 'integer', minimum: 0, maximum: 10 },
      player2_score: { type: 'integer', minimum: 0, maximum: 10 },
      winner_id: { anyOf: [ { type: 'integer', minimum: 1 }, { type: 'null' } ] },
      winner_alias: { $ref: 'Alias#' },
      tournament_id: { type: 'integer', minimum: 1 },
      player1_id: { anyOf: [ { type: 'integer', minimum: 1 }, { type: 'null' } ] },
      player2_id: { anyOf: [ { type: 'integer', minimum: 1 }, { type: 'null' } ] },
    },
  } as const;