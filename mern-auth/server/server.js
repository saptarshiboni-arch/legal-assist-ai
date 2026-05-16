import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import cookieParser from 'cookie-parser';
import connectDB from './config/mongodb.js'
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';

const app = express();
const port = process.env.PORT || 5000;
// connectDB(); // Removed duplicate call

const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:5176',
  'http://localhost:5177',
  'http://localhost:5178',
  'http://localhost:5179'
].filter(Boolean);

app.use(cookieParser());
app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
app.use(express.json());

// Request logger
app.use((req, req_res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

//API ENDPOINTS
app.get('/', (req, res) => res.send('API WORKING'));
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

const startServer = async () => {
  await connectDB();

  app.listen(port, () => {
    console.log(`Server is running on Port: ${port}`);
  });
};

startServer().catch((error) => {
  console.error('Failed to start server:', error.message);
  process.exit(1);
});

