import { sql } from "drizzle-orm";
import { text, sqliteTable, integer, unique } from "drizzle-orm/sqlite-core";
import { customAlphabet } from "nanoid";

const nanoid = customAlphabet(
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"
);

export const rolesTable = sqliteTable("roles", {
  id: text("id")
    .notNull()
    .primaryKey()
    .$defaultFn(() => nanoid()),
  name: text("name").notNull().unique(),
  description: text("description"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(strftime('%s', 'now'))`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$onUpdateFn(
    () => new Date()
  ),
});

export const permissionsTable = sqliteTable("permissions", {
  id: text("id")
    .notNull()
    .primaryKey()
    .$defaultFn(() => nanoid()),
  name: text("name").notNull().unique(),
  description: text("description"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(strftime('%s', 'now'))`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$onUpdateFn(
    () => new Date()
  ),
});

export const rolePermissionsTable = sqliteTable(
  "role_permissions",
  {
    id: text("id")
      .notNull()
      .primaryKey()
      .$defaultFn(() => nanoid()),
    roleId: text("role_id")
      .notNull()
      .references(() => rolesTable.id, {
        onUpdate: "cascade",
      }),
    permissionId: text("permission_id")
      .notNull()
      .references(() => permissionsTable.id, {
        onUpdate: "cascade",
      }),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(strftime('%s', 'now'))`),
    updatedAt: integer("updated_at", { mode: "timestamp" }).$onUpdateFn(
      () => new Date()
    ),
  },
  (t) => ({
    uniqueRoleIdAndPermissionId: unique().on(t.roleId, t.permissionId),
  })
);

export const usersTable = sqliteTable("users", {
  id: text("id")
    .notNull()
    .primaryKey()
    .$defaultFn(() => nanoid()),
  email: text("email", { length: 255 }).notNull().unique(),
  displayName: text("display_name", { length: 255 }),
  avatarUrl: text("avatar_url"),
  roleId: text("role_id")
    .notNull()
    .references(() => rolesTable.id, {
      onUpdate: "cascade",
    }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(strftime('%s', 'now'))`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$onUpdateFn(
    () => new Date()
  ),
});

export const userSessionsTable = sqliteTable("user_sessions", {
  id: text("id")
    .notNull()
    .primaryKey()
    .$defaultFn(() => nanoid()),
  userId: text("user_id")
    .notNull()
    .references(() => usersTable.id, {
      onDelete: "cascade",
      onUpdate: "cascade",
    }),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
});

export const userPasswordsTable = sqliteTable("user_passwords", {
  id: text("id")
    .notNull()
    .primaryKey()
    .$defaultFn(() => nanoid()),
  userId: text("user_id")
    .notNull()
    .unique()
    .references(() => usersTable.id, {
      onDelete: "cascade",
      onUpdate: "cascade",
    }),
  hashedPassword: text("hashed_password"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(strftime('%s', 'now'))`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$onUpdateFn(
    () => new Date()
  ),
});

export const userKeysTable = sqliteTable(
  "user_keys",
  {
    id: text("id")
      .notNull()
      .primaryKey()
      .$defaultFn(() => nanoid()),
    providerId: text("provider_key").notNull(),
    providerUserId: text("provider_user_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => usersTable.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(strftime('%s', 'now'))`),
    updatedAt: integer("updated_at", { mode: "timestamp" }).$onUpdateFn(
      () => new Date()
    ),
  },
  (t) => ({
    uniqueUserIdAndProviderId: unique().on(t.userId, t.providerId),
  })
);

export const userPermissionsTable = sqliteTable(
  "user_permissions",
  {
    id: text("id")
      .notNull()
      .primaryKey()
      .$defaultFn(() => nanoid()),
    userId: text("user_id")
      .notNull()
      .references(() => usersTable.id, {
        onUpdate: "cascade",
      }),
    permissionId: text("permission_id")
      .notNull()
      .references(() => permissionsTable.id, {
        onUpdate: "cascade",
      }),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(strftime('%s', 'now'))`),
    updatedAt: integer("updated_at", { mode: "timestamp" }).$onUpdateFn(
      () => new Date()
    ),
  },
  (t) => ({
    uniqueUserIdAndPermissionId: unique().on(t.userId, t.permissionId),
  })
);
