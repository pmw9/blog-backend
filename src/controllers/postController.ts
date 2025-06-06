import { Request, Response } from 'express';
import prisma from '../utils/prisma';

export const getPosts = async (_req: Request, res: Response): Promise<void> => {
    try {
        const posts = await prisma.post.findMany({
            include: {
                author: {
                    select: {
                        id: true,
                        username: true
                    }
                },
                comments: {
                    include: {
                        author: {
                            select: {
                                username: true
                            }
                        }
                    }
                }
            }
        });

        // Format the response to handle comment author names correctly
        const formattedPosts = posts.map(post => ({
            ...post,
            comments: post.comments.map(comment => ({
                ...comment,
                commenterName: comment.author ? comment.author.username : comment.userName
            }))
        }));

        res.json(formattedPosts);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching posts' });
    }
};

export const getPost = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const post = await prisma.post.findUnique({
            where: { id: Number(id) },
            include: {
                author: {
                    select: {
                        id: true,
                        username: true
                    }
                },
                comments: {
                    include: {
                        author: {
                            select: {
                                username: true
                            }
                        }
                    }
                }
            }
        });
        
        if (!post) {
            res.status(404).json({ message: 'Post not found' });
            return;
        }

        // Format the response to handle comment author names correctly
        const formattedPost = {
            ...post,
            comments: post.comments.map(comment => ({
                ...comment,
                commenterName: comment.author ? comment.author.username : comment.userName
            }))
        };

        res.json(formattedPost);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching post' });
    }
};

export const createPost = async (req: Request, res: Response): Promise<void> => {
    try {
        const { title, content } = req.body;
        
        const post = await prisma.post.create({
            data: {
                title,
                content,
                authorId: (req.user as any).id,
            },
            include: {
                author: {
                    select: {
                        id: true,
                        username: true
                    }
                }
            }
        });
        res.status(201).json(post);
    } catch (error) {
        console.error('Error creating post:', error);
        res.status(400).json({ message: 'Failed to create post' }); 
    }
};

export const updatePost = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { title, content } = req.body;
        const userId = (req.user as any).id;

        // Check if post exists and belongs to the user
        const existingPost = await prisma.post.findUnique({
            where: { id: Number(id) }
        });

        if (!existingPost) {
            res.status(404).json({ message: 'Post not found' });
            return;
        }

        if (existingPost.authorId !== userId) {
            res.status(403).json({ message: 'You can only update your own posts' });
            return;
        }

        const post = await prisma.post.update({
            where: { id: Number(id) },
            data: { title, content },
            include: {
                author: {
                    select: {
                        id: true,
                        username: true
                    }
                }
            }
        });
        res.json(post);
    } catch (error) {
        res.status(500).json({ message: 'Error updating post' });
    }
};

export const deletePost = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const userId = (req.user as any).id;

        // Check if post exists and belongs to the user
        const existingPost = await prisma.post.findUnique({
            where: { id: Number(id) }
        });

        if (!existingPost) {
            res.status(404).json({ message: 'Post not found' });
            return;
        }

        if (existingPost.authorId !== userId) {
            res.status(403).json({ message: 'You can only delete your own posts' });
            return;
        }

        await prisma.post.delete({
            where: { id: Number(id) }
        });

        res.status(204).send();
    } catch (error) {
        res.status(500).json({ message: 'Error deleting post' });
    }
};