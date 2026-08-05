const mongoose = require('mongoose');
const { setMongoConnected } = require('../models/Ledger');

const connectDB = async () => {
  if (!process.env.MONGO_URI || process.env.MONGO_URI.includes('<PASTE')) {
    console.warn("⚠️  MongoDB URI is missing in .env! Using persistent local NeDB database storage.");
    setMongoConnected(false);
    return;
  }

  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000
    });
    setMongoConnected(true);
    console.log('✅ MongoDB Atlas Connected and Secured...');
  } catch (err) {
    console.error('⚠️ Database connection warning:', err.message);
    console.log('🔄 Falling back to persistent NeDB database storage so API stays 100% online.');
    setMongoConnected(false);
  }
};

module.exports = connectDB;
