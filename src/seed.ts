import { seedAdminUser } from './utils/seedAdminUser';

async function main() {
  await seedAdminUser();
}

main()
  .then(() => {
    console.log('🌱 Seeding complete');
  })
  .catch((err) => {
    console.error('❌ Seeding error:', err);
  });
