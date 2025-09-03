export const TournamentSchema = {
    $id: 'TournamentSchema',
    type: 'object',
    required: ['player1_alias', 'player2_alias', 'created_by'],
    additionalProperties: false,
    properties: {
      player1_alias: { $ref: 'Alias#' },
      player2_alias: { $ref: 'Alias#' },
      created_by: { type: 'string', pattern: '^[0-9]+$' },
    },
  } as const;

  export const MatchSchema = {
    $id: 'MatchSchema',
    type: 'object',
    required: ['player1_alias', 'player2_alias','player1_score', 'player2_score',
      'winner', 'tournament_id'],
    additionalProperties: false,
    properties: {
      player1_alias: { $ref: 'Alias#' },
      player2_alias: { $ref: 'Alias#' },
      player1_score: { type: 'integer', minimum: 0, maximum: 10 },
      player2_score: { type: 'integer', minimum: 0, maximum: 10 },
      winner:        { $ref: 'Alias#' },
      tournament_id: { type: 'integer', minimum: 1 },
    },
  } as const;