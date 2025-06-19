import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { hashPassword } from '../utils/hash';

// Get users based on role
export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
    try {
        const user = req.user as { id: number; role: string };
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const skip = (page - 1) * limit;
        
        // Get total count for pagination
        const totalCount = await prisma.user.count({
            where: user.role === 'USER' ? { role: 'USER' } : undefined
        });

        const users = await prisma.user.findMany({
            where: user.role === 'USER' ? { role: 'USER' } : undefined,
            select: {
                id: true,
                username: true,
                role: true,
                createdAt: true,
                createdBy: {
                    select: {
                        username: true
                    }
                },
                posts: {
                    select: {
                        id: true,
                        title: true,
                        createdAt: true
                    }
                },
                _count: {
                    select: {
                        posts: true,
                        comments: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            },
            skip,
            take: limit
        });

        res.json({
            users,
            pagination: {
                total: totalCount,
                page,
                limit,
                totalPages: Math.ceil(totalCount / limit)
            }
        });
    } catch (error) {
        console.error('Error in getAllUsers:', error);
        res.status(500).json({ message: 'Error fetching users' });
    }
};

// Get specific user's details and posts
export const getUserById = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const requestingUser = req.user as { id: number; role: string };

        const targetUser = await prisma.user.findUnique({
            where: { id: Number(id) },
            select: {
                id: true,
                username: true,
                role: true,
                createdAt: true,
                createdBy: {
                    select: {
                        username: true
                    }
                },
                posts: {
                    orderBy: { createdAt: 'desc' },
                    select: {
                        id: true,
                        title: true,
                        content: true,
                        createdAt: true,
                        _count: {
                            select: {
                                comments: true
                            }
                        }
                    }
                },
                _count: {
                    select: {
                        posts: true,
                        comments: true
                    }
                }
            }
        });

        if (!targetUser) {
            res.status(404).json({ message: 'User not found' });
            return;
        }

        // Writers can only view other writers
        if (requestingUser.role === 'USER' && targetUser.role !== 'USER') {
            res.status(403).json({ message: 'Unauthorized to view this user' });
            return;
        }

        res.json(targetUser);
    } catch (error) {
        console.error('Error in getUserById:', error);
        res.status(500).json({ message: 'Error fetching user details' });
    }
};

// Admin-only: Create new user
export const adminCreateUser = async (req: Request, res: Response): Promise<void> => {
    try {
        const { username, password, role } = req.body;
        const adminUser = req.user as { id: number; role: string };

        // Input validation
        if (!username?.trim() || !password?.trim()) {
            res.status(400).json({ message: 'Username and password are required' });
            return;
        }

        if (role && !['ADMIN', 'USER'].includes(role)) {
            res.status(400).json({ message: 'Invalid role specified' });
            return;
        }

        // Check username uniqueness
        const existingUser = await prisma.user.findUnique({
            where: { username: username.trim() }
        });

        if (existingUser) {
            res.status(400).json({ message: 'Username already exists' });
            return;
        }

        const hashedPassword = await hashPassword(password);
        const newUser = await prisma.user.create({
            data: {
                username: username.trim(),
                password: hashedPassword,
                role: role || 'USER',
                createdById: adminUser.id // Track who created this user
            },
            select: {
                id: true,
                username: true,
                role: true,
                createdAt: true,
                createdBy: {
                    select: {
                        username: true
                    }
                }
            }
        });

        res.status(201).json({
            message: 'User created successfully',
            user: newUser
        });
    } catch (error) {
        console.error('Error in adminCreateUser:', error);
        res.status(500).json({ message: 'Error creating user' });
    }
};

// Admin-only: Update user details
export const adminUpdateUser = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { username, password } = req.body;
        const adminUser = req.user as { id: number; role: string };

        if (!username?.trim() && !password?.trim()) {
            res.status(400).json({ message: 'No update data provided' });
            return;
        }

        // Check if target user exists and get their role
        const targetUser = await prisma.user.findUnique({
            where: { id: Number(id) },
            select: {
                id: true,
                role: true,
                createdById: true
            }
        });

        if (!targetUser) {
            res.status(404).json({ message: 'User not found' });
            return;
        }

        if (targetUser.role === 'ADMIN' && 
            targetUser.id !== adminUser.id && 
            targetUser.createdById !== adminUser.id) {
            res.status(403).json({ message: 'Cannot modify other admin accounts' });
            return;
        }

        // Prepare update data
        const updateData: any = {};

        if (username?.trim()) {
            const existingUser = await prisma.user.findUnique({
                where: { username: username.trim() }
            });

            if (existingUser && existingUser.id !== Number(id)) {
                res.status(400).json({ message: 'Username already exists' });
                return;
            }
            updateData.username = username.trim();
        }

        if (password?.trim()) {
            updateData.password = await hashPassword(password);
        }

        const updatedUser = await prisma.user.update({
            where: { id: Number(id) },
            data: updateData,
            select: {
                id: true,
                username: true,
                role: true,
                updatedAt: true,
                createdBy: {
                    select: {
                        username: true
                    }
                }
            }
        });

        res.json({
            message: 'User updated successfully',
            user: updatedUser
        });
    } catch (error) {
        console.error('Error in adminUpdateUser:', error);
        res.status(500).json({ message: 'Error updating user' });
    }
};

// Admin-only: Change user role
export const adminChangeRole = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { role } = req.body;
        const adminUser = req.user as { id: number; role: string };

        if (!role || !['ADMIN', 'USER'].includes(role)) {
            res.status(400).json({ message: 'Invalid role specified' });
            return;
        }

        const targetUser = await prisma.user.findUnique({
            where: { id: Number(id) },
            select: {
                id: true,
                role: true,
                createdById: true
            }
        });

        if (!targetUser) {
            res.status(404).json({ message: 'User not found' });
            return;
        }

        if (Number(id) === adminUser.id) {
            res.status(400).json({ message: 'Cannot change your own role' });
            return;
        }

        if (targetUser.role === 'ADMIN' && targetUser.createdById !== adminUser.id) {
            res.status(403).json({ message: 'Cannot modify another admin\'s role' });
            return;
        }

        const updatedUser = await prisma.user.update({
            where: { id: Number(id) },
            data: { role },
            select: {
                id: true,
                username: true,
                role: true,
                updatedAt: true,
                createdBy: {
                    select: {
                        username: true
                    }
                }
            }
        });

        res.json({
            message: `User role updated to ${role}`,
            user: updatedUser
        });
    } catch (error) {
        console.error('Error in adminChangeRole:', error);
        res.status(500).json({ message: 'Error changing user role' });
    }
};

// Admin-only: Delete user
export const adminDeleteUser = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const adminUser = req.user as { id: number; role: string };

        const targetUser = await prisma.user.findUnique({
            where: { id: Number(id) },
            select: {
                id: true,
                role: true,
                createdById: true,
                username: true
            }
        });

        if (!targetUser) {
            res.status(404).json({ message: 'User not found' });
            return;
        }

        if (Number(id) === adminUser.id) {
            res.status(400).json({ message: 'Cannot delete your own account' });
            return;
        }

        if (targetUser.role === 'ADMIN' && targetUser.createdById !== adminUser.id) {
            res.status(403).json({ message: 'Cannot delete another admin account' });
            return;
        }

        await prisma.user.delete({
            where: { id: Number(id) }
        });

        res.json({ 
            message: `User ${targetUser.username} and all associated data deleted successfully`
        });
    } catch (error) {
        console.error('Error in adminDeleteUser:', error);
        res.status(500).json({ message: 'Error deleting user' });
    }
};

// Get a user's profile
export const getUserProfile = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({
      where: { id: Number(id) },
      select: {
        id: true,
        username: true,
        email: true,
        dob: true,
        role: true,
        createdAt: true,
        updatedAt: true
      }
    });
    if (!user) return res.status(404).json({ message: 'User not found' });
    return res.json(user);
  } catch (error: any) {
    console.error('Get user profile error:', error);
    return res.status(500).json({ message: 'Failed to fetch user profile', error: error.message || error });
  }
};

// Update a user's profile
export const updateUserProfile = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { email, dob } = req.body;
    // Check if user exists
    const user = await prisma.user.findUnique({ where: { id: Number(id) } });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    // Only update if at least one field is provided
    if (email === undefined && dob === undefined) {
      return res.status(400).json({ message: 'No update data provided' });
    }
    const updateData: any = {};
    if (email !== undefined) updateData.email = email;
    if (dob !== undefined) updateData.dob = dob ? new Date(dob) : null;
    const updatedUser = await prisma.user.update({
      where: { id: Number(id) },
      data: updateData,
      select: {
        id: true,
        username: true,
        email: true,
        dob: true,
        role: true,
        createdAt: true,
        updatedAt: true
      }
    });
    return res.json({ message: 'User profile updated', user: updatedUser });
  } catch (error: any) {
    console.error('Update user profile error:', error);
    return res.status(500).json({ message: 'Failed to update user profile', error: error.message || error });
  }
};

// PATCH /api/users/:id/role - Admin changes a user's role
export const updateUserRole = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    if (!role) {
      return res.status(400).json({ message: 'Role is required' });
    }
    const validRoles = ['USER', 'ADMIN', 'MANAGER', 'CASHIER'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }
    const updatedUser = await prisma.user.update({
      where: { id: Number(id) },
      data: { role },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        updatedAt: true
      }
    });
    return res.json({ message: 'User role updated', user: updatedUser });
  } catch (error: any) {
    console.error('Update user role error:', error);
    return res.status(500).json({ message: 'Failed to update user role', error: error.message || error });
  }
};
