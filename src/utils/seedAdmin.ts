import { PrismaClient } from '@prisma/client'
import { hashPassword } from './hash';

const prisma = new PrismaClient()

export const seedAdminUser = async () => {
  try{
    const adminExists = await prisma.user.findUnique({
      where: { username: 'admin' },
    });
    if (!adminExists) {
      const adminPassword = await hashPassword('admin123');

      await prisma.user.create({
        data: {
          username: 'admin',
          password: adminPassword,
          role: 'ADMIN',
        },
      });

      console.log('✅ Admin user created');
    } else {
      console.log('ℹ️ Admin user already exists');
    }
  }
  catch (error) {
    console.error('Error checking for admin user:', error);
    return;
  }
};
