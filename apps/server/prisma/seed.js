import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const ADMIN_EMAIL = (process.env.SEED_ADMIN_EMAIL || "admin@example.com").toLowerCase();
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || "ChangeMe123!";
const SALT_ROUNDS = 12;
const PERMISSIONS = Object.freeze([
  ["dashboard.read", "dashboard", "read"],
  ["users.read", "users", "read"],
  ["users.create", "users", "create"],
  ["users.update", "users", "update"],
  ["users.delete", "users", "delete"],
  ["roles.read", "roles", "read"],
  ["roles.manage", "roles", "manage"],
  ["analytics.read", "analytics", "read"],
  ["billing.read", "billing", "read"],
  ["billing.manage", "billing", "manage"],
  ["settings.update", "settings", "update"],
  ["audit.read", "audit", "read"]
]);

const ROLE_RULES = Object.freeze({
  VIEWER: ["dashboard.read"],
  ANALYST: ["dashboard.read", "analytics.read", "billing.read"],
  SUPPORT: ["dashboard.read", "users.read", "users.update"],
  MANAGER: [
    "dashboard.read", "users.read", "users.create", "users.update",
    "analytics.read", "audit.read"
  ],
  ADMIN: PERMISSIONS.map(([key]) => key)
});

const upsertPermissions = () => Promise.all(
  PERMISSIONS.map(([key, resource, action]) =>
    prisma.permission.upsert({
      where: { key },
      update: { resource, action },
      create: { key, resource, action }
    })
  )
);
const upsertRoles = (permissions) => {
  const permissionByKey = new Map(permissions.map((item) => [item.key, item.id]));
  return Promise.all(Object.entries(ROLE_RULES).map(([name, keys]) =>
    prisma.role.upsert({
      where: { name },
      update: {
        permissions: {
          set: keys.map((key) => ({ id: permissionByKey.get(key) }))
        }
      },
      create: {
        name,
        description: `${name.toLowerCase()} dashboard access`,
        permissions: {
          connect: keys.map((key) => ({ id: permissionByKey.get(key) }))
        }
      }
    })
  ));
};

const seedAdmin = async (roles) => {
  const adminRole = roles.find(({ name }) => name === "ADMIN");
  if (!adminRole) throw new Error("ADMIN role creation failed.");
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, SALT_ROUNDS);
  return prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: {
      name: "Platform Administrator",
      passwordHash,
      status: "ACTIVE",
      roleId: adminRole.id
    },
    create: {
      email: ADMIN_EMAIL,
      name: "Platform Administrator",
      passwordHash,
      status: "ACTIVE",
      roleId: adminRole.id
    },
    select: { id: true, email: true, status: true }
  });
};

const main = async () => {
  if (process.env.NODE_ENV === "production" && !process.env.ALLOW_PRODUCTION_SEED) {
    throw new Error("Production seeding requires ALLOW_PRODUCTION_SEED=true.");
  }
  if (ADMIN_PASSWORD.length < 12) {
    throw new Error("SEED_ADMIN_PASSWORD must contain at least 12 characters.");
  }
  const result = await prisma.$transaction(async () => {
    const permissions = await upsertPermissions();
    const roles = await upsertRoles(permissions);
    const admin = await seedAdmin(roles);
    return { permissions: permissions.length, roles: roles.length, admin };
  });
  console.info("Database seeded successfully.", result);
};

main()
  .catch((error) => {
    console.error("Database seed failed.", error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
