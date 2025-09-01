export const SignupSchema = {
    $id: 'SignupSchema',
    type: 'object',
    required: ['name', 'email', 'password'],
    additionalProperties: false,
    properties: {
      name:     {$ref: 'Alias#'},
      email:    {
         type: 'string',format: 'email',
         errorMessage: {format: 'Please enter a valid email.'}},  
      password: { type: 'string'} //minLength: 8, maxLength: 128, pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).{8,128}$'} rules = one lowercase, one uppercase, and one digit.
    },
    errorMessage: {
        required: {
          name: 'Name is required.',
          email: 'Email is required.',
          password: 'Password is required.'
        },
        additionalProperties: 'Unexpected field in request.'
      }
  } as const;