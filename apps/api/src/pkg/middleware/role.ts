import { rolesTable, usersTable } from "../db.js";
import { eq } from "drizzle-orm";
import { createMiddleware } from "hono/factory";
import { badRequestError, internalServerError } from "../errors/http";

/**
 * Check does user have this role
 */
export function userRoleMiddleware(roleName: string) {
  return createMiddleware(async (c, next) => {
    const db = c.get("db");
    const authUser = c.get("user");

    try {
      const [user] = await db
        .select({
          roleId: rolesTable.id,
          roleName: rolesTable.name,
        })
        .from(usersTable)
        .innerJoin(rolesTable, eq(usersTable.roleId, rolesTable.id))
        .where(eq(usersTable.id, authUser.id))
        .limit(1);

      if (user.roleName !== roleName) {
        return badRequestError(c, { message: "You are not authorized" });
      }

      await next();
    } catch (e) {
      return internalServerError(c);
    }
  });
}
