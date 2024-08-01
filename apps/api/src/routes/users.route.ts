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
      ? // @ts-expect-error
        like(sql`COALESCE(${usersTable.displayName},'')`, `${name}%`)
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
  const userId = c.req.valid("param").id;

  try {
    const rolePermissionsSubquery = db
      .select({
        userId: usersTable.id,
        permissions: sql`json_group_array(${permissionsTable.name})`
          .mapWith(String)
          .as("role_permissions"),
      })
      .from(rolePermissionsTable)
      .innerJoin(usersTable, eq(usersTable.roleId, rolePermissionsTable.roleId))
      .innerJoin(
        permissionsTable,
        eq(permissionsTable.id, rolePermissionsTable.permissionId)
      )
      .where(eq(usersTable.id, userId))
      .as("rp");

    const userPermissionsSubquery = db
      .select({
        userId: userPermissionsTable.userId,
        permissions: sql`json_group_array(${permissionsTable.name})`
          .mapWith(String)
          .as("user_permissions"),
      })
      .from(userPermissionsTable)
      .where(eq(userPermissionsTable.userId, userId))
      .innerJoin(
        permissionsTable,
        eq(permissionsTable.id, userPermissionsTable.permissionId)
      )
      .as("up");

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
        rolePermissions: rolePermissionsSubquery.permissions,
        userPermissions: userPermissionsSubquery.permissions,
      })
      .from(usersTable)
      .leftJoin(rolesTable, eq(rolesTable.id, usersTable.roleId))
      .leftJoin(
        userPermissionsSubquery,
        eq(userPermissionsSubquery.userId, usersTable.id)
      )
      .leftJoin(
        rolePermissionsSubquery,
        eq(rolePermissionsSubquery.userId, usersTable.id)
      )
      .where(eq(usersTable.id, userId));

    if (!user) {
      return notFoundError(c, "User does not exists");
    }

    return c.json(
      {
        ok: true,
        data: {
          user: {
            ...user,
            rolePermissions: getParsedPermissions(user.rolePermissions),
            userPermissions: getParsedPermissions(user.userPermissions),
          },
        },
      },
      200
    );
  } catch (e) {
    return internalServerError(c);
  }
});

function getParsedPermissions(permissions: string) {
  const parsedPermissions = JSON.parse(permissions);
  return Array.isArray(parsedPermissions)
    ? parsedPermissions.reduce<Record<string, boolean>>((all, p) => {
        all[p] = true;
        return all;
      }, {})
    : {};
}
