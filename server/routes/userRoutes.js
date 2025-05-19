import express from 'express';
import { z } from 'zod';
import { Post, User, Notification } from '../models.js';
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


// Zod Schema for Post Validation
const postSchema = z.object({
    caption: z.string().optional(),
    hashtags: z.array(z.string().min(1)).min(1, "At least one hashtag is required"),
    images: z.array(z.string().url()).min(1, "At least one image URL is required")
});

router.post('/create-post', verifyJWT, async (req, res) => {
    try {
        const validatedData = postSchema.parse(req.body);

        const newPost = new Post({
            author: req.user.id,
            username: req.user.username,
            caption: validatedData.caption || '',
            hashtags: validatedData.hashtags,
            images: validatedData.images,
            likes: []
        });

        await newPost.save();

        res.status(201).json({
            message: 'Post created successfully',
        });

    } catch (error) {
        if (error.name === 'ZodError') {
            return res.status(400).json({
                message: 'Validation error',
                errors: error.errors.map(err => ({
                    field: err.path[0],
                    issue: err.message
                }))
            });
        }

        console.error('Error creating post:', error);
        res.status(500).json({ message: `Internal server error ${error}` });
    }
});

router.delete('/delete-post/:id', verifyJWT, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        if (!post) return res.status(404).json({ message: 'Post not found' });

        // Check if logged-in user is the author
        if (post.author.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Unauthorized: Not your post' });
        }

        await Post.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'Post deleted successfully' });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

router.get('/myprofile', verifyJWT, async (req, res) => {
    try {
        const userId = req.user.id;

        const user = await User.findById(userId)
            .populate('followers', '_id')
            .populate('following', '_id');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Fetch all posts by the user
        const posts = await Post.find({ author: userId })
            .sort({ createdAt: -1 })
            .select('images likes')
            .lean();

        // Format posts with like count
        const formattedPosts = posts.map(post => ({
            id: post._id,
            images: post.images,
            likeCount: post.likes.length,
        }));

        // Respond with structured data
        res.status(200).json({
            username: user.username,
            avatar: user.avatar,
            name: user.name,
            bio: user.bio,
            followersCount: user.followers.length,
            followingCount: user.following.length,
            totalPosts: posts.length,
            posts: formattedPosts,
        });
    } catch (error) {
        res.status(500).json({ message: `Server error ${error}` });
    }
});

const profileUpdateSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(20),
    avatar: z.string().url('Avatar must be a valid URL').optional(),
    bio: z.string().max(200, 'Bio must be 200 characters or less').optional()
});

router.put('/edit-profile', verifyJWT, async (req, res) => {
    try {
        const user = req.user.id;
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const parsed = profileUpdateSchema.safeParse(req.body);
        if (!parsed.success) {
            const errors = parsed.error.flatten().fieldErrors;
            return res.status(400).json({ errors });
        }

        const updates = {};
        if (parsed.data.name) updates.name = parsed.data.name;
        if (parsed.data.avatar) updates.avatar = parsed.data.avatar;
        if (parsed.data.bio) updates.bio = parsed.data.bio;

        const updatedUser = await User.findByIdAndUpdate(
            user,
            updates,
            { new: true }
        ).select('name avatar bio');

        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({
            message: 'Profile updated successfully',
            user: updatedUser
        });

    } catch (error) {
        res.status(500).json({ message: `Server error ${error}` });
    }
});


router.get('/get-post/:id', verifyJWT, async (req, res) => {
    try {
        const postId = req.params.id;
        const userId = req.user.id;

        const post = await Post.findById(postId)
            .populate('author', 'username avatar')
            .lean();

        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        const likeCount = post.likes.length;
        const isLiked = post.likes.some(likedUserId => likedUserId.toString() === userId);

        // ✅ Fetch user to check if this post is saved
        const user = await User.findById(userId).select('savedPosts');
        const isSaved = user.savedPosts.some(savedId => savedId.toString() === postId);

        res.status(200).json({
            ...post,
            likeCount,
            isLiked,
            isSaved
        });
    } catch (error) {
        console.error('Error fetching post:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.get('/liked-posts', verifyJWT, async (req, res) => {
    try {
        const userId = req.user.id;
        console.log(userId)
        const user = await User.findById(userId).select('likedPosts');
        if (!user) return res.status(404).json({ message: 'User not found' });
        console.log(user)
        const posts = await Post.find({ _id: { $in: user.likedPosts } })
            .select('images likes')
            .lean();

        const formatted = posts.map(post => ({
            id: post._id,
            images: post.images,
            likeCount: post.likes.length
        }));

        res.status(200).json(formatted);
    } catch (error) {
        console.error('Error fetching liked posts:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.get('/saved-posts', verifyJWT, async (req, res) => {
    try {
        const userId = req.user.id;

        const user = await User.findById(userId).select('savedPosts');
        if (!user) return res.status(404).json({ message: 'User not found' });

        const posts = await Post.find({ _id: { $in: user.savedPosts } })
            .select('images likes')
            .lean();

        const formatted = posts.map(post => ({
            id: post._id,
            images: post.images,
            likeCount: post.likes.length
        }));

        res.status(200).json(formatted);
    } catch (error) {
        console.error('Error fetching saved posts:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.get('/notifications', verifyJWT, async (req, res) => {
    try {
        const userId = req.user.id;
        console.log(userId);
        const notifications = await Notification.find({ recipient: userId })
            .populate('from', 'username avatar') // who triggered the notification
            .populate('post', 'images')          // only populate post images if present
            .sort({ createdAt: -1 })
            .lean();

        res.status(200).json(notifications);
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.get('/get-feed-posts', verifyJWT, async (req, res) => {
    try {
        const userId = req.user.id;

        const user = await User.findById(userId).select('following savedPosts');

        // 🧠 Step 1: Get 50 random posts from users you follow
        const posts = await Post.aggregate([
            { $match: { author: { $in: user.following } } },
            { $sample: { size: 50 } } // randomly pick 50
        ]);

        // 🧠 Step 2: Enhance each post with likeCount, isLiked, isSaved, author
        const detailedPosts = await Promise.all(posts.map(async (post) => {
            const populatedPost = await Post.findById(post._id)
                .populate('author', 'username avatar')
                .lean();

            const likeCount = populatedPost.likes.length;
            const isLiked = populatedPost.likes.some(uid => uid.toString() === userId);
            const isSaved = user.savedPosts.some(savedId => savedId.toString() === post._id.toString());

            return {
                ...populatedPost,
                likeCount,
                isLiked,
                isSaved
            };
        }));

        res.status(200).json(detailedPosts);
    } catch (error) {
        console.error('Error fetching feed posts:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
export default router;
