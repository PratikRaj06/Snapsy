import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { User } from '../models.js'; // Adjust the path as needed
import dotenv from 'dotenv';
dotenv.config();

const router = express.Router();

// === ZOD SCHEMAS ===
const registerSchema = z.object({
    username: z.string().min(3, 'Username must be at least 3 characters').max(15, 'Username must me maximum 15 characters'),
    email: z.string().email('Invalid email'),
    password: z.string().min(6, 'Password must be at least 6 characters')
});

const loginSchema = z.object({
    identifier: z.string().min(1, 'Username or Email is required'),
    password: z.string().min(1, 'Password is required')
});

// === REGISTER ===
router.post('/register', async (req, res) => {
    try {
        const { username, email, password } = registerSchema.parse(req.body);
        console.log(username, email, password)
        const existingEmail = await User.findOne({ email });
        if (existingEmail) return res.status(400).json({ error: 'Email already exists' });

        const existingUsername = await User.findOne({ username });
        if (existingUsername) return res.status(400).json({ error: 'Username already exists' });

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({ username, email, password: hashedPassword });
        await newUser.save();

        const token = jwt.sign(
            { id: newUser._id, username: newUser.username },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(201).json({
            token,
            user: {
                id: newUser._id,
                username: newUser.username
            }
        });


    } catch (err) {
        if (err instanceof z.ZodError) {
            return res.status(400).json({ error: err.errors[0].message });
        }
        res.status(500).json({ error: `Server error, ${err}` });
    }
});

// === LOGIN ===
router.post('/login', async (req, res) => {
    try {
        const { identifier, password } = loginSchema.parse(req.body);

        const user = await User.findOne({
            $or: [{ email: identifier }, { username: identifier }]
        });

        if (!user) return res.status(400).json({ error: 'User not found' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ error: 'Incorrect password' });

        const token = jwt.sign({ id: user._id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '7d' });
        res.status(200).json({ token, user: { id: user._id, username: user.username, email: user.email } });

    } catch (err) {
        if (err instanceof z.ZodError) {
            return res.status(400).json({ error: err.errors[0].message });
        }
        res.status(500).json({ error: 'Server error' });
    }
});

export default router;
