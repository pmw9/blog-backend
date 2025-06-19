import prisma from './prisma';
import { hashPassword } from './hash';

export const seedAdminUser = async () => {
  const adminEmail = 'admin@steakz.com';
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (existingAdmin) {
    console.log('ℹ Admin user already exists.');
    return;
  }

  const adminPassword = await hashPassword('admin123');

  await prisma.user.create({
    data: {
      username: 'admin',
      email: adminEmail,
      password: adminPassword,
      dob: new Date('1980-01-01'),
      role: 'ADMIN',
    },
  });

  console.log('🌱 Admin user seeded.');
};
