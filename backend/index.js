const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
require('dotenv').config();

const connectDB = require('./src/config/db');
const { getMongoConnected } = require('./src/models/Ledger');
const ledgerRoutes = require('./src/routes/ledgerRoutes');

const app = express();

// Connect to Database
connectDB();

// Security Middlewares
app.set('trust proxy', 1); // Trust first proxy for deployment
app.use(helmet({ crossOriginResourcePolicy: false })); // Allow cross-origin requests
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 5000,
  message: 'Traffic spike detected. Request blocked.'
});
app.use('/api/', limiter);

app.use('/api/ledger', ledgerRoutes);

// Root route for testing connection
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    message: '✅ WeldT Secure API is live and running!',
    database: getMongoConnected() ? 'MongoDB Atlas' : 'NeDB Local Storage'
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => console.log(`🔒 Secure Server running on port ${PORT}`));
