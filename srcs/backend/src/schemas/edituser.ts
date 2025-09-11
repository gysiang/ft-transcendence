export const EditUserSchema = {
    $id: 'EditUserSchema',
    type: 'object',
    required: ['name','email'],
    additionalProperties: false,
    properties: {
      name: {$ref: 'Alias#'} ,
      email:{
		type: 'string', format: "email",
		errorMessage: {format: 'Please enter a valid email.'}},
	   },
	errorMessage: {
        required: {
          name: 'Name is required.',
          email: 'Email is required.',
        },
        additionalProperties: 'Unexpected field in request.'
      }
    } as const;
