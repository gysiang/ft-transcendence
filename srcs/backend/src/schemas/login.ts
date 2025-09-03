export const LoginSchema = {
    $id: 'LoginSchema',
    type: 'object',
    required: ['email','password'],
    additionalProperties: false,
    properties: {
      email:    { type: 'string', format: "email" },
      password: { type: 'string'}, 
    },
  } as const;