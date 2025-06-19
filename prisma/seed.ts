import { seedAdminUser } from '../src/utils/seedAdminUser';

async function main() {
  await seedAdminUser();
}

main()
  .then(() => {
    console.log('🌱 Seeding complete');
    process.exit(0);
  })
  .catch((e) => {
    console.error('❌ Seeding failed', e);
    process.exit(1);
  });
