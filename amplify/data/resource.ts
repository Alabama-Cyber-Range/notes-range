import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

// amplify/data/resource.ts
const schema = a.schema({
  Note: a.model({
    title: a.string(),
    content: a.string(),
    folder: a.string(),
    priority: a.enum(['high', 'medium', 'low', 'none']),
    color: a.string(),
    reminderAt: a.datetime(),
  }).authorization((allow) => [allow.owner()]),

  Folder: a.model({
    name: a.string().required(),
    path: a.string().required(),
    parentPath: a.string(),
  }).authorization((allow) => [allow.owner()]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool', // Required for owner-based rules
  },
});