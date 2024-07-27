import { createMiddleware } from "hono/factory";
import {
  permissionsTable,
  rolePermissionsTable,
  userPermissionsTable,
  usersTable,
} from "../db.js";
import { and, eq, sql } from "drizzle-orm";
import { badRequestError, internalServerError } from "../errors/http.js";

/**
 * Check does user have this permission
 */
export function userPermissionMiddleware(permissionName: string) {
  return createMiddleware(async (c, next) => {
    const db = c.get("db");
    const authUser = c.get("user");

    try {
      const [user] = await db
        .select({
          hasPermission: sql<Boolean>`case 
                when ${userPermissionsTable.permissionId} is not NULL then TRUE 
                when ${rolePermissionsTable.permissionId} is not NULL then TRUE 
                else FALSE
              end as has_permission`,
        })
        .from(usersTable)
        .leftJoin(
          userPermissionsTable,
          and(
            eq(usersTable.id, userPermissionsTable.userId),
            eq(
              userPermissionsTable.permissionId,
              db
                .select({ id: permissionsTable.id })
                .from(permissionsTable)
                .where(eq(permissionsTable.name, permissionName))
            )
          )
        )
        .leftJoin(
          rolePermissionsTable,
          and(
            eq(usersTable.roleId, rolePermissionsTable.roleId),
            eq(
              rolePermissionsTable.permissionId,
              db
                .select({ id: permissionsTable.id })
                .from(permissionsTable)
                .where(eq(permissionsTable.name, permissionName))
            )
          )
        )
        .where(eq(usersTable.id, authUser.id))
        .limit(1);

      if (!user.hasPermission) {
        return badRequestError(c, { message: "You are not authorized" });
      }

      await next();
    } catch (e) {
      return internalServerError(c);
    }
  });
}
