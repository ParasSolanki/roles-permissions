import { permissionsTable, rolePermissionsTable, rolesTable } from "../pkg/db";
import {
  createRoleRoute,
  deleteRoleRoute,
  getAllRolesRoute,
  getPaginatedRolesRoute,
  getRolePermissionsRoute,
  updateRoleRoute,
} from "../openapi/roles.openapi.js";
import {
  badRequestError,
  conflictError,
  internalServerError,
} from "../pkg/errors/http.js";
import { userRoleMiddleware } from "../pkg/middleware/role";
import { and, desc, eq, like, not, sql } from "drizzle-orm";
import { createProtectedApp } from "../pkg/app";

export const route = createProtectedApp();

// admin user middleware
route.use("*", userRoleMiddleware("ADMIN"));

route.openapi(getAllRolesRoute, async (c) => {
  const db = c.get("db");
  try {
    const roles = await db.select().from(rolesTable);

    return c.json(
      {
        ok: true,
        data: {
          roles,
        },
      },
      200
    );
  } catch (e) {
    return internalServerError(c);
  }
});

route.openapi(getPaginatedRolesRoute, async (c) => {
  const db = c.get("db");
  const { page, perPage, name } = c.req.valid("query");

  try {
    const nameFilter = name
      ? like(sql`COALESCE(${rolesTable.name},'')`, `${name}%`)
      : undefined;

    const [roles, total] = await Promise.all([
      db
        .select({
          id: rolesTable.id,
          name: rolesTable.name,
          description: rolesTable.description,
          createdAt: rolesTable.createdAt,
          updatedAt: rolesTable.updatedAt,
        })
        .from(rolesTable)
        .where(nameFilter)
        .orderBy(desc(rolesTable.createdAt))
        .offset((page - 1) * perPage)
        .limit(perPage),
      db
        .select({
          total: sql`count(*)`.mapWith(Number).as("total"),
        })
        .from(rolesTable)
        .where(nameFilter),
    ]);

    return c.json(
      {
        ok: true,
        data: {
          roles,
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

route.openapi(createRoleRoute, async (c) => {
  const db = c.get("db");
  const { name, description } = c.req.valid("json");

  try {
    const [role] = await db
      .select({ id: rolesTable.id })
      .from(rolesTable)
      .where(eq(rolesTable.name, name));

    if (role) {
      return conflictError(c, { message: "Role with name already exists" });
    }

    const [r] = await db
      .insert(rolesTable)
      .values({ name, description })
      .returning();

    return c.json(
      {
        ok: true,
        data: {
          role: r,
        },
      },
      201
    );
  } catch (e) {
    return internalServerError(c);
  }
});

route.openapi(updateRoleRoute, async (c) => {
  const db = c.get("db");
  const { id } = c.req.valid("param");
  const { name, description } = c.req.valid("json");

  try {
    const [role] = await db
      .select({ id: rolesTable.id })
      .from(rolesTable)
      .where(eq(rolesTable.id, id));

    if (!role) {
      return badRequestError(c, { message: "Role does not exists" });
    }
  } catch (e) {
    console.log(e);
    return internalServerError(c);
  }

  try {
    const [role] = await db
      .select({ id: rolesTable.id })
      .from(rolesTable)
      .where(and(eq(rolesTable.name, name), not(eq(rolesTable.id, id))));

    if (role) {
      return conflictError(c, { message: "Role with name already exists" });
    }
  } catch (e) {
    console.log(e);
    return internalServerError(c);
  }

  try {
    const [r] = await db
      .update(rolesTable)
      .set({ name, description })
      .where(eq(rolesTable.id, id))
      .returning();

    return c.json(
      {
        ok: true,
        data: {
          role: r,
        },
      },
      200
    );
  } catch (e) {
    console.log(e);
    return internalServerError(c);
  }
});

route.openapi(deleteRoleRoute, async (c) => {
  const db = c.get("db");
  const { id } = c.req.valid("param");

  try {
    const [role] = await db
      .select({ id: rolesTable.id, name: rolesTable.name })
      .from(rolesTable)
      .where(eq(rolesTable.id, id));

    if (!role) {
      return badRequestError(c, { message: "Role does not exists" });
    }

    if (role.name === "ADMIN") {
      return badRequestError(c, {
        message: `Not authorized to delete "ADMIN" role`,
      });
    }
  } catch (e) {
    return internalServerError(c);
  }

  try {
    await db.transaction(async (tx) => {
      await tx
        .delete(rolePermissionsTable)
        .where(eq(rolePermissionsTable.roleId, id)); // deleting role permissions relation

      await tx.delete(rolesTable).where(eq(rolesTable.id, id)); // delete role
    });

    return c.json({ ok: true }, 200);
  } catch (e) {
    return internalServerError(c);
  }
});

route.openapi(getRolePermissionsRoute, async (c) => {
  const db = c.get("db");
  const roleId = c.req.valid("param").id;

  try {
    const [role] = await db
      .select()
      .from(rolesTable)
      .where(eq(rolesTable.id, roleId));

    if (!role) {
      return badRequestError(c, { message: "Role does not exists" });
    }

    const permissions = await db
      .select({
        id: permissionsTable.id,
        name: permissionsTable.name,
        description: permissionsTable.description,
        createdAt: permissionsTable.createdAt,
        updatedAt: permissionsTable.updatedAt,
      })
      .from(permissionsTable)
      .leftJoin(
        rolePermissionsTable,
        eq(rolePermissionsTable.roleId, permissionsTable.id)
      )
      .where(eq(rolePermissionsTable.roleId, roleId));

    return c.json(
      {
        ok: true,
        data: {
          role,
          permissions,
        },
      },
      200
    );
  } catch (e) {
    return internalServerError(c);
  }
});
