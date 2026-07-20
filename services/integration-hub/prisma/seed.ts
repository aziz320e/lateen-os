import { PrismaClient } from '@prisma/integration-hub-client';
import { CONNECTOR_CATALOG } from '../src/connectors/catalog';

const prisma = new PrismaClient();

async function main() {
  for (const def of CONNECTOR_CATALOG) {
    await prisma.connectorDefinitionRecord.upsert({
      where: { code: def.code },
      create: {
        id: def.id,
        code: def.code,
        name: def.name,
        category: def.category,
        description: def.description,
        version: def.version,
        authMethods: [...def.authMethods],
        capabilities: [...def.capabilities],
      },
      update: {
        name: def.name,
        category: def.category,
        description: def.description,
        version: def.version,
        authMethods: [...def.authMethods],
        capabilities: [...def.capabilities],
      },
    });
  }
  console.log(`Seeded ${CONNECTOR_CATALOG.length} connector definitions`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
