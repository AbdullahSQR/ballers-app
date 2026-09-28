import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { env } from './config/env';
import prisma from './config/database';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import teamRoutes from './routes/team.routes';
import matchRoutes from './routes/match.routes';
import notificationRoutes from './routes/notification.routes';
import stadiumRoutes from './routes/stadium.routes';
import leaderboardRoutes from './routes/leaderboard.routes';
import challengeRoutes from './routes/challenge.routes';
import matchmakingRoutes from './routes/matchmaking.routes';

const app = express();

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', message: 'Ballers API is running' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/stadiums', stadiumRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/challenges', challengeRoutes);
app.use('/api/matchmaking', matchmakingRoutes);

const start = async () => {
  try {
    await prisma.$connect();
    console.log('Connected to database');
    app.listen(env.PORT, () => {
      console.log(`Server running on port ${env.PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
};

start();
