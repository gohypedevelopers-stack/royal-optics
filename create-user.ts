import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const username = process.env.SEED_USERNAME || "royalcustomer";
  const email = process.env.SEED_EMAIL || "customer@royaloptics.com";
  const phone = process.env.SEED_PHONE || "9999999999";
  const password = process.env.SEED_PASSWORD || "User@123";

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.upsert({
    where: { email },
    update: { username, phone, passwordHash },
    create: { username, email, phone, passwordHash },
  });

  console.log(`User ready: ${user.username} (${user.email})`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
