import prisma from './prisma';
import { hashPassword } from './hash';

export const seedAdminUser = async () => {
  try {
    const adminEmail = 'admin@steakz.com';
    const adminPassword = await hashPassword('admin123');

    // Check if admin already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: adminEmail },
    });

    if (!existingAdmin) {
      await prisma.user.create({
        data: {
          username: 'admin',
          email: adminEmail,
          password: adminPassword,
          dob: new Date('1980-01-01'),
          role: 'ADMIN',
        },
      });
      console.log('✅ Admin user seeded.');
    } else {
      console.log('ℹ Admin user already exists.');
    }
  } catch (error) {
    console.error('❌ Prisma validation error during seeding:', error);
  }
};
