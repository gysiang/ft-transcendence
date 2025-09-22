export const SignupSchema = {
    $id: 'SignupSchema',
    type: 'object',
    required: ['name', 'email', 'password'],
    additionalProperties: false,
    properties: {
      name:     {$ref: 'Alias#'},
      email: {
      type: 'string',
      format: 'email',
      errorMessage: {
        format: 'Please enter a valid email.'
      }
    },
    password: {
      type: 'string',
      minLength: 8,
      maxLength: 128,
      pattern: "^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])[A-Za-z0-9]{8,32}$",
      errorMessage: {
        minLength: 'Password must be at least 8 characters long.',
        maxLength: 'Password must not exceed 32 characters.',
        pattern: 'Password must contain at least one lowercase, one uppercase letter, and one digit.'
      }
    }
}
,
    errorMessage: {
        required: {
          name: 'Name is required.',
          email: 'Email is required.',
          password: 'Password is required.'
        },
        additionalProperties: 'Unexpected field in request.'
      }
  } as const;
