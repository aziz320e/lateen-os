import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const org = await prisma.organization.upsert({
    where: { code: 'LATEEN' },
    update: {},
    create: {
      id: '00000000-0000-4000-8000-000000000001',
      code: 'LATEEN',
      name: 'Lateen Manufacturing',
      legalName: 'Lateen Manufacturing LLC',
      registrationNumber: 'REG-001',
      taxId: 'TAX-001',
      status: 'active',
      defaultCurrency: 'SAR',
      defaultLocale: 'ar-SA',
      timezone: 'Asia/Riyadh',
      operatingModel: 'ai_first',
      proactiveAiEnabled: true,
      industryVerticals: ['signage', 'branding'],
      productionModel: 'make_to_order',
      serviceCoverage: 'regional',
    },
  });

  console.info('Seeded organization:', org.code);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
