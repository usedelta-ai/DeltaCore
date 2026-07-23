import { pgTable, serial, varchar, boolean, timestamp, integer, text, jsonb, customType, index } from 'drizzle-orm/pg-core';

// Custom type for bytea (binary) data to support logo storage
const bytea = customType<{ data: Buffer }>({
  dataType() {
    return 'bytea';
  },
});

// 1. Tabela Empresa
export const empresa = pgTable('empresa', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  logo: bytea('logo'),
  active: boolean('active').default(true).notNull(),
});

// 2. Tabela Users
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(),
  role: varchar('role', { length: 50 }).default('employee').notNull(),
  empresa_id: integer('empresa_id').references(() => empresa.id, { onDelete: 'set null' }),
  active: boolean('active').default(true).notNull(),
  must_change_password: boolean('must_change_password').default(false).notNull(),
  avatar: text('avatar'),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// 2.5 Tabela User Sessions
export const userSessions = pgTable('user_sessions', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  token: varchar('token', { length: 255 }).notNull().unique(),
  ip_address: varchar('ip_address', { length: 45 }),
  device_info: text('device_info'),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  last_activity_at: timestamp('last_activity_at', { withTimezone: true }).defaultNow(),
  expires_at: timestamp('expires_at', { withTimezone: true }),
  is_revoked: boolean('is_revoked').default(false).notNull(),
}, (table) => [
  index('idx_user_sessions_user_id').on(table.user_id),
  index('idx_user_sessions_token').on(table.token),
]);

// 3. Tabela Agents
export const agents = pgTable('agents', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  prompt: text('prompt').notNull(),
  phone_number: varchar('phone_number', { length: 50 }).notNull(),
  instance_name: varchar('instance_name', { length: 100 }).notNull(),
  status: integer('status').default(1).notNull(),
  empresa_id: integer('empresa_id').references(() => empresa.id, { onDelete: 'set null' }).notNull(),
  upsert_lead: boolean('upsert_lead').default(true).notNull(),
  translations: jsonb('translations'),
  search: boolean('search').default(false).notNull(),
  search_data: jsonb('search_data'),
  validate: boolean('validate').default(false).notNull(),
  validate_data: jsonb('validate_data'),
  custom_properties_schema: jsonb('custom_properties_schema'),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => [
  index('idx_agents_empresa_id').on(table.empresa_id),
]);

// 4. Tabela Follow Up Settings
export const follow_up_settings = pgTable('follow_up_settings', {
  id: serial('id').primaryKey(),
  order: integer('order').notNull(),
  message: text('message').notNull(),
  time: integer('time').notNull(),
  agent_id: integer('agent_id').references(() => agents.id, { onDelete: 'cascade' }).notNull(),
  active: boolean('active').default(true).notNull(),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// 4.5. Tabela Pessoa
export const pessoa = pgTable('pessoa', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 50 }).notNull().unique(),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// 5. Tabela Lead
export const lead = pgTable('lead', {
  id: serial('id').primaryKey(),
  agent_id: integer('agent_id').references(() => agents.id, { onDelete: 'set null' }).notNull(),
  remote_jid_alt: varchar('remote_jid_alt', { length: 255 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  custom_properties: jsonb('custom_properties'),
  status: varchar('status', { length: 50 }).default('NOVO').notNull(),
  taken_over_at: timestamp('taken_over_at', { withTimezone: true }),
  take_over_expires_at: timestamp('take_over_expires_at', { withTimezone: true }),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  taken_motive: text('taken_motive'),
  value: varchar('value', { length: 255 }),
  lastmessage: text('lastmessage'),
  follow_up_id: integer('follow_up_id').references(() => follow_up_settings.id, { onDelete: 'set null' }),
  session_id: varchar('session_id', { length: 255 }),
  pessoa_id: integer('pessoa_id').references(() => pessoa.id, { onDelete: 'set null' }),
  finalized_by: integer('finalized_by').references(() => users.id, { onDelete: 'set null' }),
}, (table) => [
  index('idx_lead_agent_id').on(table.agent_id),
  index('idx_lead_pessoa_id').on(table.pessoa_id),
  index('idx_lead_session_id').on(table.session_id),
  index('idx_lead_status_updated_at').on(table.status, table.updated_at),
  index('idx_lead_agent_id_status').on(table.agent_id, table.status),
  index('idx_lead_agent_status_updated_id').on(table.agent_id, table.status, table.updated_at, table.id),
]);

// 6. Tabela Messages
export const messages = pgTable('messages', {
  id: serial('id').primaryKey(),
  agent_id: integer('agent_id').references(() => agents.id, { onDelete: 'set null' }).notNull(),
  session_id: varchar('session_id', { length: 255 }).notNull(),
  content: text('content').notNull(),
  role: varchar('role', { length: 50 }).notNull(),
  source: varchar('source', { length: 50 }).notNull(),
  remote_jid: varchar('remote_jid', { length: 255 }).notNull(),
  message_type: varchar('message_type', { length: 50 }).notNull(),
  message_id: varchar('message_id', { length: 255 }).notNull(),
  quote_message_content: text('quote_message_content'),
  user_id: integer('user_id').references(() => users.id, { onDelete: 'set null' }),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => [
  index('idx_messages_session_id_created_at').on(table.session_id, table.created_at),
]);

// 7. Tabela Lead History (Nova)
export const lead_history = pgTable('lead_history', {
  id: serial('id').primaryKey(),
  lead_id: integer('lead_id').references(() => lead.id, { onDelete: 'cascade' }).notNull(),
  user_id: integer('user_id').references(() => users.id, { onDelete: 'set null' }),
  agent_id: integer('agent_id').references(() => agents.id, { onDelete: 'set null' }),
  changed_by_agent: boolean('changed_by_agent').default(false).notNull(),
  field_name: varchar('field_name', { length: 100 }).notNull(),
  old_value: text('old_value'),
  new_value: text('new_value'),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_lead_history_lead_id').on(table.lead_id),
]);
