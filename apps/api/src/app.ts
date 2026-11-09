import 'express-async-errors';
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes';
import workspacesRoutes from './routes/workspaces.routes';
import { errorHandler } from './middleware/error.middleware';

export const app = express();

// Enable CORS for frontend clients on any local port (5173, 5174, etc.)
app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Modular REST API routes
app.use('/api/auth', authRoutes);
app.use('/api/workspaces', workspacesRoutes);

// Unmatched route 404 handler
app.use((req, res) => {
  res.status(404).json({
    statusCode: 404,
    message: `Cannot ${req.method} ${req.originalUrl}`,
    error: 'Not Found',
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
  });
});

// Central error handling middleware
app.use(errorHandler);

