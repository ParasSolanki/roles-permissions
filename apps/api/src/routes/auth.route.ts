import {
  DB,
  permissionsTable,
  rolePermissionsTable,
  rolesTable,
  userKeysTable,
  userPasswordsTable,
  userPermissionsTable,
  usersTable,
} from "../pkg/db";
import { and, eq, sql } from "drizzle-orm";
import { getCookie } from "hono/cookie";
import { PROVIDER_KEYS } from "../constants/provider.js";
import {
  csrfRoute,
  sessionRoute,
  signinRoute,
  signoutRoute,
  signupRoute,
} from "../openapi/auth.openapi.js";
import { createCsrfToken, validateCsrfToken } from "../utils/csrf-token.js";
import {
  badRequestError,
  conflictError,
  forbiddenError,
  internalServerError,
  unauthorizedError,
} from "../pkg/errors/http";
import { hashPassword, verifyPassword } from "../utils/password";
import { createApp } from "../pkg/app";

export const route = createApp();

route.openapi(signupRoute, async (c) => {
  const lucia = c.get("lucia");
  const db = c.get("db");
  const headers = c.req.valid("header");
  const isValid = await validateCsrfToken(
    headers["x-csrf-token"],
    c.env.TOKEN_SECRET
  );

  if (!isValid) return forbiddenError(c);

  const sessionCookie = getCookie(c, lucia.sessionCookieName);

  if (sessionCookie) {
    const { session } = await lucia.validateSession(sessionCookie);

    if (session) return forbiddenError(c);
  }

  const { email, password } = c.req.valid("json");

  try {
    var memberRole = await db
      .select({ id: rolesTable.id })
      .from(rolesTable)
      .where(eq(rolesTable.name, "MEMBER"))
      .limit(1);
    const [user] = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.email, email))
      .limit(1);

    if (!memberRole) {
      return internalServerError(c);
    }

    if (user) {
      return conflictError(c, { message: "User already exists with email" });
    }
  } catch (e) {
    console.log(e);
    return internalServerError(c);
  }

  try {
    const user = await db.transaction(async (tx) => {
      const [user] = await tx
        .insert(usersTable)
        .values({
          roleId: memberRole[0].id,
          email,
        })
        .returning({
          id: usersTable.id,
        });
      const hashedPassword = await hashPassword(password);

      await tx.insert(userPasswordsTable).values({
        hashedPassword,
        userId: user.id,
      });

      await tx.insert(userKeysTable).values({
        providerId: PROVIDER_KEYS.EMAIL,
        providerUserId: email,
        userId: user.id,
      });

      return user;
    });

    const { data, error } = await getUser({ db, userId: user.id });

    if (error || !data) throw new Error("Something went wrong");

    const session = await lucia.createSession(user.id, {});

    const sessionCookie = lucia.createSessionCookie(session.id).serialize();

    c.header("Set-Cookie", sessionCookie);

    return c.json(
      {
        ok: true,
        data: {
          user: data,
        },
      },
      201
    );
  } catch (e) {
    console.log(e);
    return internalServerError(c);
  }
});

// sign in route
route.openapi(signinRoute, async (c) => {
  const lucia = c.get("lucia");
  const db = c.get("db");
  const headers = c.req.valid("header");
  const isValid = await validateCsrfToken(
    headers["x-csrf-token"],
    c.env.TOKEN_SECRET
  );

  if (!isValid) return forbiddenError(c);

  const sessionCookie = getCookie(c, lucia.sessionCookieName);

  if (sessionCookie) {
    const { session } = await lucia.validateSession(sessionCookie);

    if (session) return forbiddenError(c);
  }

  const { email, password } = c.req.valid("json");

  try {
    const [usersData, keysData] = await Promise.all([
      db
        .select({ id: usersTable.id })
        .from(usersTable)
        .where(eq(usersTable.email, email))
        .limit(1),
      db
        .select({
          userId: userKeysTable.userId,
        })
        .from(userKeysTable)
        .where(
          and(
            eq(userKeysTable.providerId, PROVIDER_KEYS.EMAIL),
            eq(userKeysTable.providerUserId, email)
          )
        )
        .limit(1),
    ]);

    const user = usersData[0];
    const key = keysData[0];

    if (!user || !key) {
      return badRequestError(c, { message: "Incorrect email or password" });
    }
  } catch (e) {
    console.log(e);
    return internalServerError(c);
  }

  try {
    const [user] = await db
      .select({
        id: usersTable.id,
        hashedPassword: userPasswordsTable.hashedPassword,
      })
      .from(usersTable)
      .leftJoin(
        userPasswordsTable,
        eq(usersTable.id, userPasswordsTable.userId)
      )
      .where(eq(usersTable.email, email))
      .limit(1);

    // no user found
    if (!user) {
      return badRequestError(c, { message: "Incorrect email or password" });
    }

    // user does not have password
    if (!user.hashedPassword) {
      return badRequestError(c, { message: "Incorrect email or password" });
    }

    const isPasswordValid = await verifyPassword(user.hashedPassword, password);

    if (!isPasswordValid) {
      return badRequestError(c, { message: "Incorrect email or password" });
    }

    const { data, error } = await getUser({ db, userId: user.id });

    if (error || !data) throw new Error("Something went wrong");

    const session = await lucia.createSession(user.id, {});

    const sessionCookie = lucia.createSessionCookie(session.id).serialize();

    c.header("Set-Cookie", sessionCookie);

    return c.json(
      {
        ok: true,
        data: {
          user: data,
        },
      },
      200
    );
  } catch (e) {
    return internalServerError(c);
  }
});

// session route
route.openapi(sessionRoute, async (c) => {
  const lucia = c.get("lucia");
  const db = c.get("db");
  const sessionCookie = getCookie(c, lucia.sessionCookieName);

  if (!sessionCookie) return unauthorizedError(c);

  try {
    const { session, user: sessionUser } =
      await lucia.validateSession(sessionCookie);

    if (!session || !sessionUser) {
      return unauthorizedError(c);
    }

    if (session.fresh) {
      const newSessionCookie = lucia
        .createSessionCookie(session.id)
        .serialize();
      c.header("Set-Cookie", newSessionCookie, { append: true });
    }

    const { data, error } = await getUser({ db, userId: sessionUser.id });

    if (error || !data) throw new Error("Something went wrong");

    return c.json(
      {
        ok: true,
        data: {
          user: data,
        },
      },
      200
    );
  } catch (e) {
    return internalServerError(c);
  }
});

// sign out route
route.openapi(signoutRoute, async (c) => {
  const lucia = c.get("lucia");
  const headers = c.req.valid("header");
  const isValid = await validateCsrfToken(
    headers["x-csrf-token"],
    c.env.TOKEN_SECRET
  );

  if (!isValid) return forbiddenError(c);

  const sessionCookie = getCookie(c, lucia.sessionCookieName);

  if (!sessionCookie) return unauthorizedError(c);

  try {
    const { session } = await lucia.validateSession(sessionCookie);

    if (!session) return unauthorizedError(c);

    await lucia.invalidateSession(session.id);

    c.header("Set-Cookie", lucia.createBlankSessionCookie().serialize());

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

// csrf token route
route.openapi(csrfRoute, async (c) => {
  const csrfToken = await createCsrfToken(c.env.TOKEN_SECRET);

  return c.json(
    {
      ok: true,
      data: {
        csrfToken,
      },
    },
    200
  );
});

async function getUser({ db, userId }: { db: DB; userId: string }) {
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

    const role = user.role;

    if (!role) throw new Error("User role does not exists");

    const data = {
      ...user,
      role,
      rolePermissions: getParsedPermissions(user.rolePermissions),
      userPermissions: getParsedPermissions(user.userPermissions),
      provider: "email",
    };

    return { data, error: undefined };
  } catch (e) {
    console.log(e);
    return { data: undefined, error: e };
  }
}

function getParsedPermissions(permissions: string) {
  const parsedPermissions = JSON.parse(permissions);
  return Array.isArray(parsedPermissions)
    ? parsedPermissions.reduce<Record<string, boolean>>((all, p) => {
        all[p] = true;
        return all;
      }, {})
    : {};
}
