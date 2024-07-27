import {
  permissionsTable,
  rolePermissionsTable,
  userPermissionsTable,
  usersTable,
} from "../pkg/db";
import { eq } from "drizzle-orm";
import {
  getMePermissionsRoute,
  updateMeDisplayNameRoute,
} from "../openapi/me.openapi.js";
import { internalServerError } from "../pkg/errors/http";
import { createProtectedApp } from "../pkg/app";

export const route = createProtectedApp();

route.openapi(updateMeDisplayNameRoute, async (c) => {
  const db = c.get("db");
  const { displayName } = c.req.valid("json");

  try {
    const authUser = c.get("user");
    await db
      .update(usersTable)
      .set({
        displayName,
        updatedAt: new Date(),
      })
      .where(eq(usersTable.id, authUser.id));

    return c.json(
      {
        ok: true,
      },
      200
    );
  } catch (e) {
    return internalServerError(c);
  }
});

route.openapi(getMePermissionsRoute, async (c) => {
  const db = c.get("db");
  const user = c.get("user");
  try {
    const userPermissionsSubquery = db
      .select({
        userId: userPermissionsTable.userId,
        permissionId: userPermissionsTable.permissionId,
      })
      .from(userPermissionsTable)
      .where(eq(userPermissionsTable.userId, user.id))
      .as("up");

    const rolePermissionsSubquery = db
      .select({
        userId: usersTable.id,
        permissionId: rolePermissionsTable.permissionId,
      })
      .from(rolePermissionsTable)
      .innerJoin(usersTable, eq(rolePermissionsTable.roleId, usersTable.roleId))
      .where(eq(usersTable.id, user.id));

    const combinedPermissions = db
      .select()
      .from(userPermissionsSubquery)
      .union(rolePermissionsSubquery)
      .as("cp");

    const permissions = await db
      .select({
        name: permissionsTable.name,
      })
      .from(permissionsTable)
      .innerJoin(
        combinedPermissions,
        eq(permissionsTable.id, combinedPermissions.permissionId)
      )
      .where(eq(combinedPermissions.userId, user.id));
    return c.json(
      {
        ok: true,
        data: {
          permissions: permissions.reduce<Record<string, boolean>>((all, p) => {
            all[p.name] = true;
            return all;
          }, {}),
        },
      },
      200
    );
  } catch (e) {
    return internalServerError(c);
  }
});
