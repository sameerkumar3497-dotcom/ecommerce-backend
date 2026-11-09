import 'dotenv/config';
import { prisma } from '../config/prisma';
import { hashPassword } from '../utils/password';

async function main() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error('Set ADMIN_EMAIL and ADMIN_PASSWORD in .env first');
  }
  if (password.length < 8 || password.length > 72) {
    throw new Error('ADMIN_PASSWORD must be 8 to 72 characters');
  }

  const passwordHash = await hashPassword(password);

  const admin = await prisma.user.upsert({
    where: { email },
    update: { role: 'ADMIN' },
    create: { name: 'Admin', email, passwordHash, role: 'ADMIN' },
  });

  console.log(`Admin ready: ${admin.email}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
