import {
  permissionsTable,
  rolePermissionsTable,
  rolesTable,
  userPermissionsTable,
  usersTable,
} from "../pkg/db";
import {
  getAllUsersRoute,
  getPaginatedUsersRoute,
  getUserDetailsRoute,
} from "../openapi/users.openapi.js";
import {
  badRequestError,
  internalServerError,
  notFoundError,
} from "../pkg/errors/http";
import { and, desc, eq, like, lt, sql, inArray } from "drizzle-orm";
import { userPermissionMiddleware } from "../pkg/middleware/permission";
import { createProtectedApp } from "../pkg/app";

export const route = createProtectedApp();

route.openapi(getAllUsersRoute, async (c) => {
  const db = c.get("db");
  const query = c.req.valid("query");

  if (query.cursor && isNaN(new Date(query.cursor).getTime())) {
    return badRequestError(c, { message: "Invalid cursor" });
  }

  try {
    const cursor = query.cursor ? new Date(query.cursor) : new Date();

    const users = await db
      .select({
        id: usersTable.id,
        displayName: usersTable.displayName,
        createdAt: usersTable.createdAt,
      })
      .from(usersTable)
      .where(
        and(
          like(usersTable.displayName, query.name ? `${query.name}%` : "%"),
          lt(usersTable.createdAt, cursor)
        )
      )
      .orderBy(desc(usersTable.createdAt))
      .groupBy(usersTable.id)
      .limit(20);

    return c.json(
      {
        ok: true,
        data: {
          users,
          cursor: users.at(-1)?.createdAt.getTime(),
        },
      },
      200
    );
  } catch (e) {
    return internalServerError(c);
  }
});

route.use(
  getPaginatedUsersRoute.getRoutingPath(),
  userPermissionMiddleware("users:read")
);
route.openapi(getPaginatedUsersRoute, async (c) => {
  const db = c.get("db");
  const { page, perPage, name, role } = c.req.valid("query");

  try {
    const nameFilter = name
      ? like(sql`COALESCE(${usersTable.displayName},'')`, `${name}%`)
      : undefined;
    const roleFilter = Array.isArray(role)
      ? inArray(rolesTable.name, role)
      : role
        ? eq(rolesTable.name, role)
        : undefined;

    const [users, total] = await Promise.all([
      db
        .select({
          id: usersTable.id,
          email: usersTable.email,
          displayName: usersTable.displayName,
          avatarUrl: usersTable.avatarUrl,
          createdAt: usersTable.createdAt,
          updatedAt: usersTable.updatedAt,
          role: {
            id: rolesTable.id,
            name: rolesTable.name,
            description: rolesTable.description,
          },
        })
        .from(usersTable)
        .leftJoin(rolesTable, eq(rolesTable.id, usersTable.roleId))
        .where(and(nameFilter, roleFilter))
        .orderBy(desc(usersTable.createdAt))
        .offset((page - 1) * perPage)
        .limit(perPage),
      db
        .select({
          total: sql`count(*)`.mapWith(Number).as("total"),
        })
        .from(usersTable)
        .leftJoin(rolesTable, eq(rolesTable.id, usersTable.roleId))
        .where(and(nameFilter, roleFilter)),
    ]);

    return c.json(
      {
        ok: true,
        data: {
          users,
          pagination: {
            page,
            perPage,
            total: Math.ceil(total[0].total / perPage),
          },
        },
      },
      200
    );
  } catch (e) {
    return internalServerError(c);
  }
});

route.use(
  getUserDetailsRoute.getRoutingPath(),
  userPermissionMiddleware("users:read"),
  userPermissionMiddleware("users:edit")
);

route.openapi(getUserDetailsRoute, async (c) => {
  const db = c.get("db");
  const { id } = c.req.valid("param");

  try {
    const userPermissionsSubquery = db
      .select({
        userId: userPermissionsTable.userId,
        permissionId: userPermissionsTable.permissionId,
      })
      .from(userPermissionsTable)
      .where(eq(userPermissionsTable.userId, id))
      .as("up");

    const rolePermissionsSubquery = db
      .select({
        userId: usersTable.id,
        permissionId: rolePermissionsTable.permissionId,
      })
      .from(rolePermissionsTable)
      .innerJoin(usersTable, eq(rolePermissionsTable.roleId, usersTable.roleId))
      .where(eq(usersTable.id, id));

    const combinedPermissions = db
      .select()
      .from(userPermissionsSubquery)
      .union(rolePermissionsSubquery)
      .as("cp");

    const permissionsSubquery = db
      .select({
        userId: combinedPermissions.userId,
        permissions: sql`json_group_array(${permissionsTable.name})`
          .mapWith(String)
          .as("permissions"),
      })
      .from(permissionsTable)
      .innerJoin(
        combinedPermissions,
        eq(permissionsTable.id, combinedPermissions.permissionId)
      )
      .where(eq(combinedPermissions.userId, id))
      .as("p");

    const [user] = await db
      .select({
        id: usersTable.id,
        displayName: usersTable.displayName,
        email: usersTable.email,
        avatarUrl: usersTable.avatarUrl,
        createdAt: usersTable.createdAt,
        updatedAt: usersTable.updatedAt,
        role: {
          id: rolesTable.id,
          name: rolesTable.name,
        },
        permissions: permissionsSubquery.permissions,
      })
      .from(usersTable)
      .leftJoin(rolesTable, eq(rolesTable.id, usersTable.roleId))
      .leftJoin(
        permissionsSubquery,
        eq(permissionsSubquery.userId, usersTable.id)
      )
      .where(eq(usersTable.id, id));

    if (!user) {
      return notFoundError(c, "User does not exists");
    }

    const parsedPermissions = JSON.parse(user.permissions);
    const permissions = Array.isArray(parsedPermissions)
      ? parsedPermissions.reduce<Record<string, boolean>>((all, p) => {
          all[p] = true;
          return all;
        }, {})
      : {};

    return c.json(
      {
        ok: true,
        data: {
          user: {
            ...user,
            permissions,
          },
        },
      },
      200
    );
  } catch (e) {
    return internalServerError(c);
  }
});
