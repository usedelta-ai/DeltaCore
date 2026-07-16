"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.lead_history = exports.messages = exports.lead = exports.follow_up_settings = exports.agents = exports.users = exports.empresa = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
// Custom type for bytea (binary) data to support logo storage
const bytea = (0, pg_core_1.customType)({
    dataType() {
        return 'bytea';
    },
});
// 1. Tabela Empresa
exports.empresa = (0, pg_core_1.pgTable)('empresa', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    name: (0, pg_core_1.varchar)('name', { length: 255 }).notNull(),
    logo: bytea('logo'),
    active: (0, pg_core_1.boolean)('active').default(true).notNull(),
});
// 2. Tabela Users
exports.users = (0, pg_core_1.pgTable)('users', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    name: (0, pg_core_1.varchar)('name', { length: 255 }).notNull(),
    email: (0, pg_core_1.varchar)('email', { length: 255 }).notNull().unique(),
    password: (0, pg_core_1.varchar)('password', { length: 255 }).notNull(),
    role: (0, pg_core_1.varchar)('role', { length: 50 }).default('employee').notNull(),
    empresa_id: (0, pg_core_1.integer)('empresa_id').references(() => exports.empresa.id, { onDelete: 'set null' }),
    active: (0, pg_core_1.boolean)('active').default(true).notNull(),
    created_at: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).defaultNow(),
    updated_at: (0, pg_core_1.timestamp)('updated_at', { withTimezone: true }).defaultNow(),
});
// 3. Tabela Agents
exports.agents = (0, pg_core_1.pgTable)('agents', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    name: (0, pg_core_1.varchar)('name', { length: 255 }).notNull(),
    prompt: (0, pg_core_1.text)('prompt').notNull(),
    phone_number: (0, pg_core_1.varchar)('phone_number', { length: 50 }).notNull(),
    instance_name: (0, pg_core_1.varchar)('instance_name', { length: 100 }).notNull(),
    status: (0, pg_core_1.integer)('status').default(1).notNull(),
    empresa_id: (0, pg_core_1.integer)('empresa_id').references(() => exports.empresa.id, { onDelete: 'set null' }).notNull(),
    upsert_lead: (0, pg_core_1.boolean)('upsert_lead').default(true).notNull(),
    translations: (0, pg_core_1.jsonb)('translations'),
    search: (0, pg_core_1.boolean)('search').default(false).notNull(),
    search_data: (0, pg_core_1.jsonb)('search_data'),
    validate: (0, pg_core_1.boolean)('validate').default(false).notNull(),
    validate_data: (0, pg_core_1.jsonb)('validate_data'),
    created_at: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).defaultNow(),
    updated_at: (0, pg_core_1.timestamp)('updated_at', { withTimezone: true }).defaultNow(),
});
// 4. Tabela Follow Up Settings
exports.follow_up_settings = (0, pg_core_1.pgTable)('follow_up_settings', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    order: (0, pg_core_1.integer)('order').notNull(),
    message: (0, pg_core_1.text)('message').notNull(),
    time: (0, pg_core_1.integer)('time').notNull(),
    agent_id: (0, pg_core_1.integer)('agent_id').references(() => exports.agents.id, { onDelete: 'cascade' }).notNull(),
    active: (0, pg_core_1.boolean)('active').default(true).notNull(),
    created_at: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).defaultNow(),
});
// 5. Tabela Lead
exports.lead = (0, pg_core_1.pgTable)('lead', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    agent_id: (0, pg_core_1.integer)('agent_id').references(() => exports.agents.id, { onDelete: 'set null' }).notNull(),
    remote_jid_alt: (0, pg_core_1.varchar)('remote_jid_alt', { length: 255 }).notNull(),
    name: (0, pg_core_1.varchar)('name', { length: 255 }).notNull(),
    custom_properties: (0, pg_core_1.jsonb)('custom_properties'),
    status: (0, pg_core_1.varchar)('status', { length: 50 }).default('NOVO').notNull(),
    taken_over_at: (0, pg_core_1.timestamp)('taken_over_at', { withTimezone: true }),
    take_over_expires_at: (0, pg_core_1.timestamp)('take_over_expires_at', { withTimezone: true }),
    updated_at: (0, pg_core_1.timestamp)('updated_at', { withTimezone: true }).defaultNow(),
    created_at: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).defaultNow(),
    taken_motive: (0, pg_core_1.text)('taken_motive'),
    value: (0, pg_core_1.varchar)('value', { length: 255 }),
    lastmessage: (0, pg_core_1.text)('lastmessage'),
    follow_up_id: (0, pg_core_1.integer)('follow_up_id').references(() => exports.follow_up_settings.id, { onDelete: 'set null' }),
    session_id: (0, pg_core_1.varchar)('session_id', { length: 255 }),
});
// 6. Tabela Messages
exports.messages = (0, pg_core_1.pgTable)('messages', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    agent_id: (0, pg_core_1.integer)('agent_id').references(() => exports.agents.id, { onDelete: 'set null' }).notNull(),
    session_id: (0, pg_core_1.varchar)('session_id', { length: 255 }).notNull(),
    content: (0, pg_core_1.text)('content').notNull(),
    role: (0, pg_core_1.varchar)('role', { length: 50 }).notNull(),
    source: (0, pg_core_1.varchar)('source', { length: 50 }).notNull(),
    remote_jid: (0, pg_core_1.varchar)('remote_jid', { length: 255 }).notNull(),
    message_type: (0, pg_core_1.varchar)('message_type', { length: 50 }).notNull(),
    message_id: (0, pg_core_1.varchar)('message_id', { length: 255 }).notNull(),
    quote_message_content: (0, pg_core_1.text)('quote_message_content'),
    user_id: (0, pg_core_1.integer)('user_id').references(() => exports.users.id, { onDelete: 'set null' }),
    created_at: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).defaultNow(),
});
// 7. Tabela Lead History (Nova)
exports.lead_history = (0, pg_core_1.pgTable)('lead_history', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    lead_id: (0, pg_core_1.integer)('lead_id').references(() => exports.lead.id, { onDelete: 'cascade' }).notNull(),
    user_id: (0, pg_core_1.integer)('user_id').references(() => exports.users.id, { onDelete: 'set null' }),
    agent_id: (0, pg_core_1.integer)('agent_id').references(() => exports.agents.id, { onDelete: 'set null' }),
    changed_by_agent: (0, pg_core_1.boolean)('changed_by_agent').default(false).notNull(),
    field_name: (0, pg_core_1.varchar)('field_name', { length: 100 }).notNull(),
    old_value: (0, pg_core_1.text)('old_value'),
    new_value: (0, pg_core_1.text)('new_value'),
    created_at: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).defaultNow().notNull(),
});
