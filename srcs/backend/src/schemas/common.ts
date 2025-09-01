export const AliasPattern = {
    $id: 'Alias',
    type: 'string',
    minLength: 1,
    maxLength: 32,
    pattern: "^[A-Za-z0-9]+$",
    errorMessage: {
        minLength: 'Alias is required.',
        maxLength: 'Alias must be 32 characters or fewer.',
        pattern:   'Alias can only contain letters and numbers.',}
  } as const;
  
  export const IdString = {
    $id: 'IdString',
    type: 'object',
    required: ['id'],
    additionalProperties: false,
    properties: {
      id: { type: 'string', pattern: '^[0-9]+$' },
    },
  } as const;