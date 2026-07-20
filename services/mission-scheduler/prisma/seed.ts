import { PrismaClient } from '@prisma/mission-scheduler-client';
import { MISSION_TYPE_CATALOG } from '../src/mission/catalog';

const prisma = new PrismaClient();

async function main() {
  for (const type of MISSION_TYPE_CATALOG) {
    await prisma.missionTypeRecord.upsert({
      where: { code: type.code },
      create: {
        id: type.id,
        code: type.code,
        name: type.name,
        description: type.description,
        targetService: type.targetService,
      },
      update: {
        name: type.name,
        description: type.description,
        targetService: type.targetService,
      },
    });
  }
  console.log(`Seeded ${MISSION_TYPE_CATALOG.length} mission types`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
