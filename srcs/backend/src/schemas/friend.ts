export const AddFriendSchema = {
    $id: 'AddFriendSchema',
    type: 'object',
    required: ['user_id','friend_email'],
    additionalProperties: false,
    properties: {
      user_id:      {$ref: 'IdString#'},
      friend_email: { type: 'string', format: "email" },
    },
  } as const;

export const DeleteFriendSchema = {
    $id: 'DeleteFriendSchema',
    type: 'object',
    required: ['user_id','friend_id'],
    additionalProperties: false,
    properties: {
      user_id:      {$ref: 'IdString#'},
      friend_id:    {$ref: 'IdString#'},
    },
  } as const;
