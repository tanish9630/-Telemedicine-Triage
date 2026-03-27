import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

import dotenv from 'dotenv';

dotenv.config();

// Basic health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'CareConnect AI API is running' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
