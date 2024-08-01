import { permissionsTable, rolePermissionsTable, rolesTable } from "../pkg/db";
import {
  getAllPermissionsRoute,
  getPaginatedPermissionsRoute,
} from "../openapi/permissions.openapi.js";
import { internalServerError } from "../pkg/errors/http.js";
import { userRoleMiddleware } from "../pkg/middleware/role";
import { and, desc, eq, inArray, like, sql } from "drizzle-orm";
import { createProtectedApp } from "../pkg/app";

export const route = createProtectedApp();
// admin user middleware
route.use("*", userRoleMiddleware("ADMIN"));

route.openapi(getAllPermissionsRoute, async (c) => {
  const db = c.get("db");
  try {
    const permissions = await db
      .select({
        id: permissionsTable.id,
        name: permissionsTable.name,
        description: permissionsTable.description,
      })
      .from(permissionsTable);

    return c.json(
      {
        ok: true,
        data: {
          permissions,
        },
      },
      200
    );
  } catch (e) {
    return internalServerError(c);
  }
});

route.openapi(getPaginatedPermissionsRoute, async (c) => {
  const db = c.get("db");
  const { page, perPage, name, role } = c.req.valid("query");

  try {
    const nameFilter = name
      ? // @ts-expect-error
        like(sql`COALESCE(${permissionsTable.name},'')`, `${name}%`)
      : undefined;
    const roleFilter = Array.isArray(role)
      ? inArray(rolesTable.name, role)
      : role
        ? eq(rolesTable.name, role)
        : undefined;

    const [permissions, total] = await Promise.all([
      db
        .select({
          id: permissionsTable.id,
          name: permissionsTable.name,
          description: permissionsTable.description,
          createdAt: permissionsTable.createdAt,
          updatedAt: permissionsTable.updatedAt,
          roles: sql`
              case
                when count(${rolesTable.id}) = 0 then json('[]')
                else json(json_group_array(
                        json_object('id', ${rolesTable.id}, 'name', ${rolesTable.name})
            ))
              end`
            .mapWith({
              mapFromDriverValue(value: string) {
                return JSON.parse(value) as Array<{
                  id: string;
                  name: string;
                }>;
              },
            })
            .as("roles"),
        })
        .from(permissionsTable)
        .leftJoin(
          rolePermissionsTable,
          eq(rolePermissionsTable.permissionId, permissionsTable.id)
        )
        .leftJoin(rolesTable, eq(rolesTable.id, rolePermissionsTable.roleId))
        .where(and(nameFilter, roleFilter))
        .orderBy(desc(permissionsTable.createdAt))
        .groupBy(permissionsTable.name)
        .offset((page - 1) * perPage)
        .limit(perPage),
      db
        .select({
          total: sql`count(*)`.mapWith(Number).as("total"),
        })
        .from(permissionsTable)
        .leftJoin(
          rolePermissionsTable,
          eq(rolePermissionsTable.permissionId, permissionsTable.id)
        )
        .leftJoin(rolesTable, eq(rolesTable.id, rolePermissionsTable.roleId))
        .where(and(nameFilter, roleFilter))
        .groupBy(permissionsTable.name),
    ]);

    return c.json(
      {
        ok: true,
        data: {
          permissions,
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
    console.log(e);
    return internalServerError(c);
  }
});
