import { PrismaClient } from '@prisma/identity-client';
import { randomBytes, scrypt } from 'node:crypto';
import { promisify } from 'node:util';

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const derived = (await scryptAsync(password, salt, 64)) as Buffer;
  return `scrypt:${salt}:${derived.toString('hex')}`;
}

const DEFAULT_ORG_ID = '00000000-0000-4000-8000-000000000001';

async function main() {
  const prisma = new PrismaClient();

  const passwordHash = await hashPassword('Admin123!');

  const org = await prisma.organizationIdentity.upsert({
    where: { organizationId: DEFAULT_ORG_ID },
    create: {
      organizationId: DEFAULT_ORG_ID,
      name: 'Lateen Demo Organization',
      status: 'active',
    },
    update: { name: 'Lateen Demo Organization' },
  });

  await prisma.user.upsert({
    where: { organizationId_email: { organizationId: org.id, email: 'admin@lateen.local' } },
    create: {
      organizationId: org.id,
      email: 'admin@lateen.local',
      username: 'admin',
      passwordHash,
      displayName: 'Platform Admin',
      roles: ['admin'],
      permissions: ['*:*'],
      status: 'active',
    },
    update: {
      passwordHash,
      roles: ['admin'],
      permissions: ['*:*'],
    },
  });

  console.log('Seeded organization identity and admin user (admin / Admin123!)');
  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
