import { Request, Response } from 'express';
import { handleError } from '../utils/errorHandler';
import prisma from '../utils/prisma';

export const getAllComments = async (_req: Request, res: Response): Promise<any> => {
    try {
        const comments = await prisma.comment.findMany({
            include: {
                post: true,
                author: {
                    select: {
                        username: true
                    }
                }
            }
        });
        
        // Transform the response to include the proper commenter name
        const formattedComments = comments.map((comment: any) => ({
            ...comment,
            commenterName: comment.author ? comment.author.username : comment.userName
        }));
        
        return res.status(200).json(formattedComments);
    } catch (error) {
        return handleError(error, res);
    }
}

export const createComment = async (req: Request, res: Response): Promise<any> => {
    try {
        const { content, postId, userName } = req.body;
        const authUser = req.user as { id: number; username: string } | undefined;

        // Verify that the post exists
        const post = await prisma.post.findUnique({
            where: { id: Number(postId) }
        });

        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        // Create comment data based on authentication status
        const commentData: any = {
            content,
            postId: Number(postId),
            approved: false, // All new comments are unapproved by default
        };

        // If user is authenticated, link the comment to their account
        if (authUser) {
            commentData.authorId = authUser.id;
        } else {
            // For anonymous users, store their provided name
            commentData.userName = userName || 'Anonymous';
        }

        const comment = await prisma.comment.create({
            data: commentData,
            include: {
                post: {
                    select: {
                        id: true,
                        title: true,
                        authorId: true
                    }
                },
                author: {
                    select: {
                        username: true
                    }
                }
            }
        });

        // Format the response to include the proper commenter name
        const formattedComment = {
            ...comment,
            commenterName: comment.author ? comment.author.username : comment.userName
        };

        return res.status(201).json(formattedComment);
    } catch (error) {
        return handleError(error, res);
    }
};

export const deleteComment = async (req: Request, res: Response): Promise<any> => {
    try {
        const { id } = req.params;
        const user = req.user as { id: number; role: string };

        const comment = await prisma.comment.findUnique({
            where: { id: Number(id) },
            include: {
                post: true
            }
        });

        if (!comment) {
            return res.status(404).json({ message: 'Comment not found' });
        }

        // Allow admins to delete any comment
        if (user.role === 'ADMIN') {
            await prisma.comment.delete({
                where: { id: Number(id) }
            });
            return res.status(204).send();
        }

        // For non-admins, check if they own the post
        if (comment.post.authorId !== user.id) {
            return res.status(403).json({ message: 'Unauthorized to delete this comment' });
        }

        if (user.role !== 'admin' && comment.post.authorId !== user.id) {
            return res.status(403).json({ message: 'Unauthorized to delete this comment' });
        }

        await prisma.comment.delete({
            where: { id: Number(id) }
        });
        return res.status(204).send();
    } catch (error) {
        return handleError(error, res);
    }
};