import {
  integer,
  text,
  sqliteTable,
  index,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";
import {
  TeamRole,
  Role,
  AuthType,
  InvitationStatus,
} from "../../../../packages/types";

const timestamps = {
  updatedAt: integer({ mode: "timestamp_ms" })
    .notNull()
    .$onUpdate(() => new Date()),
  createdAt: integer({ mode: "timestamp_ms" })
    .$defaultFn(() => new Date())
    .notNull(),
};

const DEFAULT_AVATAR = "https://i.imgur.com/6VBx3io.png";
const DEFAULT_LOGO =
  "https://github.com/HugoRCD/shelve/blob/main/assets/default.webp?raw=true";

export const users = sqliteTable("users", {
  id: integer().primaryKey({ autoIncrement: true }),
  username: text({ length: 25 }).unique().notNull(),
  email: text({ length: 50 }).unique().notNull(),
  avatar: text({ length: 500 }).default(DEFAULT_AVATAR).notNull(),
  role: text().$type<Role>().default(Role.USER).notNull(),
  authType: text().$type<AuthType>().notNull(),
  onboarding: integer({ mode: "boolean" }).default(false).notNull(),
  cliInstalled: integer({ mode: "boolean" }).default(false).notNull(),
  otpCode: text({ length: 6 }),
  otpToken: text({ length: 64 }),
  otpExpiresAt: integer({ mode: "timestamp_ms" }),
  otpAttempts: integer().default(0),
  otpLastRequestAt: integer({ mode: "timestamp_ms" }),
  ...timestamps,
});

export const githubApp = sqliteTable("github_app", {
  id: integer().primaryKey({ autoIncrement: true }),
  installationId: integer().notNull(),
  isOrganisation: integer({ mode: "boolean" }).default(false).notNull(),
  userId: integer()
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  ...timestamps,
});

export const teams = sqliteTable(
  "teams",
  {
    id: integer().primaryKey({ autoIncrement: true }),
    name: text({ length: 50 }).notNull(),
    slug: text({ length: 50 }).unique().notNull(),
    logo: text({ length: 500 }).default(DEFAULT_LOGO).notNull(),
    ...timestamps,
  },
  (table) => [uniqueIndex("teams_slug_idx").on(table.slug)]
);

export const members = sqliteTable(
  "members",
  {
    id: integer().primaryKey({ autoIncrement: true }),
    userId: integer()
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    teamId: integer()
      .references(() => teams.id, { onDelete: "cascade" })
      .notNull(),
    role: text().$type<TeamRole>().default(TeamRole.MEMBER).notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("members_user_team_idx").on(table.userId, table.teamId),
    index("members_role_idx").on(table.role),
    index("members_team_role_idx").on(table.teamId, table.role),
  ]
);

export const invitations = sqliteTable(
  "invitations",
  {
    id: integer().primaryKey({ autoIncrement: true }),
    email: text({ length: 50 }).notNull(),
    teamId: integer()
      .references(() => teams.id, { onDelete: "cascade" })
      .notNull(),
    role: text().$type<TeamRole>().default(TeamRole.MEMBER).notNull(),
    token: text({ length: 64 }).unique().notNull(),
    status: text()
      .$type<InvitationStatus>()
      .default(InvitationStatus.PENDING)
      .notNull(),
    invitedById: integer().references(() => users.id, {
      onDelete: "set null",
    }),
    expiresAt: integer({ mode: "timestamp_ms" }).notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("invitations_token_idx").on(table.token),
    uniqueIndex("invitations_email_team_idx").on(table.email, table.teamId),
    index("invitations_team_idx").on(table.teamId),
    index("invitations_status_idx").on(table.status),
  ]
);

export const projects = sqliteTable(
  "projects",
  {
    id: integer().primaryKey({ autoIncrement: true }),
    name: text({ length: 50 }).notNull(),
    teamId: integer()
      .references(() => teams.id, { onDelete: "cascade" })
      .notNull(),
    description: text({ length: 500 }).default("").notNull(),
    repository: text({ length: 200 }).default("").notNull(),
    projectManager: text({ length: 200 }).default("").notNull(),
    homepage: text({ length: 200 }).default("").notNull(),
    variablePrefix: text({ length: 500 }).default("").notNull(),
    logo: text({ length: 500 }).default(DEFAULT_LOGO).notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("projects_team_name_idx").on(table.teamId, table.name),
    index("projects_team_idx").on(table.teamId),
  ]
);

export const variables = sqliteTable(
  "variables",
  {
    id: integer().primaryKey({ autoIncrement: true }),
    projectId: integer()
      .references(() => projects.id, { onDelete: "cascade" })
      .notNull(),
    key: text({ length: 50 }).notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("variables_project_key_idx").on(table.projectId, table.key),
    index("variables_key_idx").on(table.key),
    index("variables_project_idx").on(table.projectId),
  ]
);

export const variableValues = sqliteTable(
  "variable_values",
  {
    id: integer().primaryKey({ autoIncrement: true }),
    variableId: integer()
      .references(() => variables.id, { onDelete: "cascade" })
      .notNull(),
    environmentId: integer()
      .references(() => environments.id, { onDelete: "cascade" })
      .notNull(),
    value: text({ length: 4000 }).notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("variable_values_variable_env_idx").on(
      table.variableId,
      table.environmentId
    ),
    index("variable_values_env_idx").on(table.environmentId),
  ]
);

export const tokens = sqliteTable(
  "tokens",
  {
    id: integer().primaryKey({ autoIncrement: true }),
    token: text({ length: 800 }).unique().notNull(),
    name: text({ length: 25 }).notNull(),
    userId: integer()
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("tokens_token_idx").on(table.token),
    index("tokens_user_idx").on(table.userId),
  ]
);

export const environments = sqliteTable(
  "environments",
  {
    id: integer().primaryKey({ autoIncrement: true }),
    name: text({ length: 25 }).notNull(),
    teamId: integer()
      .references(() => teams.id, { onDelete: "cascade" })
      .notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("environments_team_name_idx").on(table.teamId, table.name),
    index("environments_team_idx").on(table.teamId),
  ]
);

export const teamStats = sqliteTable(
  "team_stats",
  {
    id: integer().primaryKey({ autoIncrement: true }),
    teamId: integer()
      .unique()
      .references(() => teams.id, { onDelete: "set null" }),
    pushCount: integer("push_count").notNull().default(0),
    pullCount: integer("pull_count").notNull().default(0),
    ...timestamps,
  },
  (table) => [uniqueIndex("team_stats_id_idx").on(table.id)]
);

export const githubAppRelations = relations(githubApp, ({ one }) => ({
  users: one(users, {
    fields: [githubApp.userId],
    references: [users.id],
  }),
}));

export const teamsRelations = relations(teams, ({ many }) => ({
  members: many(members),
  projects: many(projects),
  environments: many(environments),
  invitations: many(invitations),
}));

export const membersRelations = relations(members, ({ one }) => ({
  team: one(teams, {
    fields: [members.teamId],
    references: [teams.id],
  }),
  user: one(users, {
    fields: [members.userId],
    references: [users.id],
  }),
}));

export const invitationsRelations = relations(invitations, ({ one }) => ({
  team: one(teams, {
    fields: [invitations.teamId],
    references: [teams.id],
  }),
  invitedBy: one(users, {
    fields: [invitations.invitedById],
    references: [users.id],
  }),
}));

export const projectsRelations = relations(projects, ({ one }) => ({
  team: one(teams, {
    fields: [projects.teamId],
    references: [teams.id],
  }),
}));

export const variablesRelations = relations(variables, ({ one, many }) => ({
  project: one(projects, {
    fields: [variables.projectId],
    references: [projects.id],
  }),
  values: many(variableValues),
}));

export const tokensRelations = relations(tokens, ({ one }) => ({
  user: one(users, {
    fields: [tokens.userId],
    references: [users.id],
  }),
}));

export const environmentsRelations = relations(
  environments,
  ({ one, many }) => ({
    team: one(teams, {
      fields: [environments.teamId],
      references: [teams.id],
    }),
    values: many(variableValues),
  })
);

export const variableValuesRelations = relations(variableValues, ({ one }) => ({
  variable: one(variables, {
    fields: [variableValues.variableId],
    references: [variables.id],
  }),
  environment: one(environments, {
    fields: [variableValues.environmentId],
    references: [environments.id],
  }),
}));
