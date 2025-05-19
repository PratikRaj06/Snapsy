import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import authRoutes from './routes/authRoutes.js'
import userRoutes from './routes/userRoutes.js'
import publicRoutes from './routes/publicRoutes.js'
import dotenv from 'dotenv';
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error('MongoDB connection failed:', error.message);
        process.exit(1);
    }
};

// Middleware
app.use(cors());
app.use(express.json());

app.use('/auth', authRoutes)
app.use('/user', userRoutes)
app.use('/public', publicRoutes)

app.get('/', (req, res) => {
    res.send('API is running...');
});

// Connect to DB and start server
connectDB();
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
