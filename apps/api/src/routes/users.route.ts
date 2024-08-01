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
  updateUserRoleAndPermissionRoute,
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

route.use(
  updateUserRoleAndPermissionRoute.getRoutingPath(),
  userPermissionMiddleware("users:read"),
  userPermissionMiddleware("users:edit")
);
route.openapi(updateUserRoleAndPermissionRoute, async (c) => {
  const userId = c.req.valid("param").id;
  const body = c.req.valid("json");
  const db = c.get("db");

  try {
    var [user] = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.id, userId));
    var [role] = await db
      .select({
        id: rolesTable.id,
        name: rolesTable.name,
        permissions: sql`
        case
          when count(${permissionsTable.id}) = 0 then json('[]')
          else json_group_array(
                  json_object('id', ${permissionsTable.id}, 'name', ${permissionsTable.name})
                )
        end`
          .mapWith({
            mapFromDriverValue(value: string) {
              return JSON.parse(value) as Array<{
                id: string;
                name: string;
              }>;
            },
          })
          .as("permissions"),
      })
      .from(rolesTable)
      .innerJoin(
        rolePermissionsTable,
        eq(rolePermissionsTable.roleId, rolesTable.id)
      )
      .innerJoin(
        permissionsTable,
        eq(permissionsTable.id, rolePermissionsTable.permissionId)
      )
      .where(eq(rolesTable.id, body.roleId));

    var permissions = await db
      .select({ id: permissionsTable.id, name: permissionsTable.name })
      .from(permissionsTable);

    if (!user) return notFoundError(c, "User does not exists");

    if (!role) return badRequestError(c, { message: "Role does not exists" });
  } catch (e) {
    return internalServerError(c);
  }

  // All permissoin names
  const permissionNames = new Set(permissions.map((p) => p.name));

  // All valid requested role and user permissions
  const valdRequestedPermissions = Object.entries(body.permissions)
    .filter(([name]) => permissionNames.has(name))
    .reduce((acc, [name, value]) => ({ ...acc, [name]: value }), {});

  // All valid role permission names
  const rolePermissionNames = new Set(role.permissions.map((p) => p.name));
  // All valid requested user permissions outside their role permissions
  const validRequestedUserPermissions = Object.entries(valdRequestedPermissions)
    .filter(([name]) => !rolePermissionNames.has(name))
    .reduce((acc, [name, value]) => ({ ...acc, [name]: value }), {});

  try {
    await db.transaction(async (tx) => {
      await tx
        .update(usersTable)
        .set({ roleId: body.roleId })
        .where(eq(usersTable.id, userId));

      // Get current user permissions of user
      const currentUserPermissions = await tx
        .select({ name: permissionsTable.name })
        .from(permissionsTable)
        .innerJoin(
          userPermissionsTable,
          eq(userPermissionsTable.permissionId, permissionsTable.id)
        )
        .innerJoin(usersTable, eq(usersTable.id, userPermissionsTable.userId))
        .where(eq(usersTable.id, userId));

      const currentUserPermissionNames = new Set(
        currentUserPermissions.map((p) => p.name)
      );

      // Permissions to add
      const userPermissionsToAdd = Object.entries(validRequestedUserPermissions)
        .filter(
          ([name, value]) => value && !currentUserPermissionNames.has(name)
        )
        .map(([name, _]) => name);

      const userPermissionsToRemove = [
        // Permissions to remove
        ...Object.entries(validRequestedUserPermissions)
          .filter(
            ([name, value]) => !value && currentUserPermissionNames.has(name)
          )
          .map(([name, _]) => name),
        // Permissions which are in user permissions but already getting covered by that role.
        ...currentUserPermissions
          .filter((p) => rolePermissionNames.has(p.name))
          .map((p) => p.name),
      ];

      // Add permissions
      if (userPermissionsToAdd.length) {
        const permissionToAddIds = await tx
          .select({ id: permissionsTable.id })
          .from(permissionsTable)
          .where(inArray(permissionsTable.name, userPermissionsToAdd));

        await tx
          .insert(userPermissionsTable)
          .values(
            permissionToAddIds.map((p) => ({ userId, permissionId: p.id }))
          );
      }
      // Remove permissions
      if (userPermissionsToRemove.length) {
        const permissionToRemoveIds = await tx
          .select({ id: permissionsTable.id })
          .from(permissionsTable)
          .where(inArray(permissionsTable.name, userPermissionsToRemove));

        await tx.delete(userPermissionsTable).where(
          and(
            eq(userPermissionsTable.userId, userId),
            inArray(
              userPermissionsTable.permissionId,
              permissionToRemoveIds.map((p) => p.id)
            )
          )
        );
      }
    });

    return c.json({ ok: true }, 200);
  } catch (e) {
    console.log(e);
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
