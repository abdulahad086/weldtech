const mongoose = require('mongoose');

const CompanySchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    createdAt: { type: Date, default: Date.now }
});

const TransactionSchema = new mongoose.Schema({
    companyId: { type: String, required: true },
    date: { type: Date, required: true },
    customerName: { type: String },
    billNo: { type: String },
    debit: { type: Number, default: 0 },
    credit: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now }
});

const Company = mongoose.model('Company', CompanySchema);
const Transaction = mongoose.model('Transaction', TransactionSchema);

module.exports = { Company, Transaction };
