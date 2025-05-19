import express from 'express';
import { z } from 'zod';
import { Post, User, Notification, Comment } from '../models.js';
import jwt from 'jsonwebtoken';

import dotenv from 'dotenv';
dotenv.config();

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET;

export const verifyJWT = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Invalid or expired token' });
    }
};

router.get('/get-user/:id', verifyJWT, async (req, res) => {
    try {
        const userId = req.params.id;
        const currentUserId = req.user.id;

        const user = await User.findById(userId)
            .populate('followers', '_id')
            .populate('following', '_id');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const posts = await Post.find({ author: userId })
            .sort({ createdAt: -1 })
            .select('images likes')
            .lean();

        const formattedPosts = posts.map(post => ({
            id: post._id,
            images: post.images,
            likeCount: post.likes.length,
        }));

        // ✅ Check if current user is following the viewed user
        const isFollowing = user.followers.some(f => f._id.toString() === currentUserId);

        res.status(200).json({
            username: user.username,
            avatar: user.avatar,
            name: user.name,
            bio: user.bio,
            followersCount: user.followers.length,
            followingCount: user.following.length,
            totalPosts: posts.length,
            posts: formattedPosts,
            isFollowing, // ✅ Include this in the response
        });
    } catch (error) {
        res.status(500).json({ message: `Server error ${error}` });
    }
});


router.get('/search', verifyJWT, async (req, res) => {
    const { username } = req.query;

    if (!username) {
        return res.status(400).json({ message: 'Username query param is required' });
    }

    try {
        const users = await User.find({
            username: { $regex: username, $options: 'i' }, // case-insensitive search
            _id: { $ne: req.user.id } // exclude the current user
        }).select('_id username avatar'); // only return needed fields

        res.json(users);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});


router.get('/explore', verifyJWT, async (req, res) => {
    try {
        const posts = await Post.aggregate([
            { $sample: { size: 20 } }, // get 20 random posts
            {
                $project: {
                    _id: 1,
                    images: 1,
                    likeCount: { $size: '$likes' }
                }
            }
        ]);

        res.json(posts);
    } catch (err) {
        console.error('Error fetching random posts:', err);
        res.status(500).json({ error: 'Failed to fetch random posts' });
    }
});


// POST /api/like/:postId
router.post('/like-unlike/:postId', verifyJWT, async (req, res) => {
    try {
        const userId = req.user.id;
        const { postId } = req.params;

        const post = await Post.findById(postId);

        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        const alreadyLiked = post.likes.includes(userId);

        if (alreadyLiked) {
            // Unlike
            post.likes.pull(userId);
            await post.save();

            // Also remove from user's likedPosts
            await User.findByIdAndUpdate(userId, {
                $pull: { likedPosts: postId }
            });

            return res.status(200).json({ message: 'Post unliked', likeCount: post.likes.length });
        } else {
            // Like
            post.likes.push(userId);
            await post.save();

            // Also add to user's likedPosts
            await User.findByIdAndUpdate(userId, {
                $addToSet: { likedPosts: postId }
            });

            // Create notification (skip if liking your own post)
            if (post.author.toString() !== userId) {
                await Notification.create({
                    recipient: post.author,
                    from: userId,
                    type: 'like',
                    post: post._id,
                });
            }

            return res.status(200).json({ message: 'Post liked', likeCount: post.likes.length });
        }

    } catch (error) {
        console.error('Like error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// POST /public/save-unsave/:id
router.post('/save-unsave/:id', verifyJWT, async (req, res) => {
    try {
        const userId = req.user.id;
        const postId = req.params.id;

        const user = await User.findById(userId);

        if (!user) return res.status(404).json({ message: 'User not found' });

        const alreadySaved = user.savedPosts.includes(postId);

        let updatedUser;
        if (alreadySaved) {
            updatedUser = await User.findByIdAndUpdate(
                userId,
                { $pull: { savedPosts: postId } },
                { new: true }
            );
        } else {
            updatedUser = await User.findByIdAndUpdate(
                userId,
                { $addToSet: { savedPosts: postId } },
                { new: true }
            );
        }

        res.status(200).json({
            message: alreadySaved ? 'Post unsaved' : 'Post saved',
            saved: !alreadySaved
        });
    } catch (error) {
        console.error('Save/Unsave Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.post('/follow/:id', verifyJWT, async (req, res) => {
    try {
        const targetUserId = req.params.id;
        const currentUserId = req.user.id;

        if (targetUserId === currentUserId.toString()) {
            return res.status(400).json({ message: "You can't follow yourself." });
        }

        const targetUser = await User.findById(targetUserId);
        const currentUser = await User.findById(currentUserId);

        if (!targetUser || !currentUser) {
            return res.status(404).json({ message: "User not found." });
        }

        const isFollowing = currentUser.following.includes(targetUserId);

        if (isFollowing) {
            // Unfollow
            currentUser.following.pull(targetUserId);
            targetUser.followers.pull(currentUserId);
        } else {
            // Follow
            currentUser.following.push(targetUserId);
            targetUser.followers.push(currentUserId);

            // Create notification
            await Notification.create({
                recipient: targetUserId,
                from: currentUserId,
                type: 'follow',
            });
        }

        await currentUser.save();
        await targetUser.save();

        res.status(200).json({ following: !isFollowing });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});

router.get('/get-comments/:postId', verifyJWT, async (req, res) => {
    try {
        const { postId } = req.params;

        const comments = await Comment.find({ post: postId })
            .sort({ timestamp: -1 }) // Newest first
            .populate('user', 'username avatar') // Fetch avatar + username
            .lean();

        res.status(200).json(comments);
    } catch (err) {
        console.error('Error fetching comments:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

const addCommentSchema = z.object({
    postId: z.string().min(1, 'Post ID is required'),
    text: z.string().min(1, 'Comment cannot be empty')
});
router.post('/add-comment', verifyJWT, async (req, res) => {
    try {
        const result = addCommentSchema.safeParse(req.body);
        if (!result.success) {
            return res.status(400).json({ message: result.error.errors[0].message });
        }

        const { postId, text } = result.data;
        const userId = req.user.id;

        const user = await User.findById(userId);
        const post = await Post.findById(postId);

        if (!post) return res.status(404).json({ message: 'Post not found' });

        const newComment = await Comment.create({
            post: postId,
            user: userId,
            username: user.username,
            text
        });

        // ✅ Create notification if commenter isn't the post author
        if (post.author.toString() !== userId) {
            await Notification.create({
                recipient: post.author,
                type: 'comment',
                from: userId,
                post: postId
            });
        }

        res.status(201).json(newComment);
    } catch (err) {
        console.error('Error adding comment:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// ✅ Delete a comment
router.delete('/delete-comment/:id', verifyJWT, async (req, res) => {
    try {
        const commentId = req.params.id;
        const userId = req.user.id;

        const comment = await Comment.findById(commentId);

        if (!comment) return res.status(404).json({ message: 'Comment not found' });

        if (comment.user.toString() !== userId) {
            return res.status(403).json({ message: 'You can only delete your own comments' });
        }

        await Comment.findByIdAndDelete(commentId);
        res.status(200).json({ message: 'Comment deleted successfully' });
    } catch (err) {
        console.error('Error deleting comment:', err);
        res.status(500).json({ message: 'Server error' });
    }
});
export default router