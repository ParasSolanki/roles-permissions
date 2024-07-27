import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import { env } from "./env.js";
import {
  rolesTable,
  permissionsTable,
  rolePermissionsTable,
} from "./schema.js";

async function main() {
  const client = createClient({
    url: env.DATABASE_URL,
    authToken: env.DATABASE_AUTH_TOKEN,
  });

  const db = drizzle(client);

  console.log("Seeding roles data");

  const adminRole = await db
    .insert(rolesTable)
    .values({ name: "ADMIN" })
    .returning({ id: rolesTable.id });
  const memberRole = await db
    .insert(rolesTable)
    .values({ name: "MEMBER" })
    .returning({ id: rolesTable.id });

  console.log("Seeding permissions data");

  const dashboardReadPermission = await db
    .insert(permissionsTable)
    .values({ name: "dashboard:read", description: "Can see dashboards data" })
    .returning({ id: permissionsTable.id });
  const usersReadPermission = await db
    .insert(permissionsTable)
    .values({ name: "users:read", description: "Can see all users data" })
    .returning({ id: permissionsTable.id });
  const usersEditPermission = await db
    .insert(permissionsTable)
    .values({ name: "users:edit", description: "Can edit users data" })
    .returning({ id: permissionsTable.id });
  const usersDeletePermission = await db
    .insert(permissionsTable)
    .values({ name: "users:delete", description: "Can delete users data" })
    .returning({ id: permissionsTable.id });

  console.log("Seeding roles permissions data");

  await db.batch([
    db.insert(rolePermissionsTable).values({
      roleId: adminRole[0]?.id,
      permissionId: dashboardReadPermission[0]?.id,
    }),
    db.insert(rolePermissionsTable).values({
      roleId: adminRole[0]?.id,
      permissionId: usersReadPermission[0]?.id,
    }),
    db.insert(rolePermissionsTable).values({
      roleId: adminRole[0]?.id,
      permissionId: usersEditPermission[0]?.id,
    }),
    db.insert(rolePermissionsTable).values({
      roleId: adminRole[0]?.id,
      permissionId: usersDeletePermission[0]?.id,
    }),
    db.insert(rolePermissionsTable).values({
      roleId: memberRole[0]?.id,
      permissionId: dashboardReadPermission[0]?.id,
    }),
  ]);

  client.close();

  console.log("Seed complete");

  process.exit(0);
}

main().catch((e) => {
  console.error("Migration failed");
  console.error(e);
  process.exit(1);
});
