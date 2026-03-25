const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
require('dotenv').config();

const connectDB = require('./src/config/db');
const ledgerRoutes = require('./src/routes/ledgerRoutes');

const app = express();

// Connect to Cloud Database
connectDB();

// Security Middlewares
app.use(helmet()); 
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 200, 
  message: 'Traffic spike detected. Request blocked.'
});
app.use('/api/', limiter);

app.use('/api/ledger', ledgerRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🔒 Secure Server running on port ${PORT}`));
