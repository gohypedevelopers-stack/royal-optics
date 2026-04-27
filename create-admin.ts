import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const username = process.env.ADMIN_SEED_USERNAME || "admin";
  const email = process.env.ADMIN_SEED_EMAIL || "admin@royaloptics.com";
  const password = process.env.ADMIN_SEED_PASSWORD || "Admin@123";

  const passwordHash = await bcrypt.hash(password, 12);

  const admin = await prisma.adminUser.upsert({
    where: { username },
    update: { email, passwordHash },
    create: { username, email, passwordHash },
  });

  console.log(`Admin ready: ${admin.username} (${admin.email})`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
