const mongoose = require('mongoose');
const Datastore = require('nedb-promises');
const path = require('path');

const dbPath = path.join(__dirname, '../../db');
const companiesNeDB = Datastore.create({ filename: path.join(dbPath, 'companies.db'), autoload: true });
const transactionsNeDB = Datastore.create({ filename: path.join(dbPath, 'transactions.db'), autoload: true });

// Mongoose Schemas
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

const MongoCompany = mongoose.model('Company', CompanySchema);
const MongoTransaction = mongoose.model('Transaction', TransactionSchema);

let isMongoConnected = false;

function setMongoConnected(status) {
    isMongoConnected = status;
}

function getMongoConnected() {
    return isMongoConnected;
}

// Unified Company Wrapper
const Company = {
    async create(doc) {
        if (isMongoConnected && mongoose.connection.readyState === 1) {
            return await MongoCompany.create(doc);
        }
        const exist = await companiesNeDB.findOne({ name: doc.name });
        if (exist) {
            const err = new Error('Company with this name already exists');
            err.code = 11000;
            throw err;
        }
        return await companiesNeDB.insert({ ...doc, createdAt: doc.createdAt || new Date() });
    },

    find(query = {}) {
        if (isMongoConnected && mongoose.connection.readyState === 1) {
            return MongoCompany.find(query);
        }
        const p = companiesNeDB.find(query);
        p.lean = async () => await p;
        return p;
    },

    async findOne(query) {
        if (isMongoConnected && mongoose.connection.readyState === 1) {
            return await MongoCompany.findOne(query);
        }
        return await companiesNeDB.findOne(query);
    },

    async deleteOne(query) {
        if (isMongoConnected && mongoose.connection.readyState === 1) {
            return await MongoCompany.deleteOne(query);
        }
        const count = await companiesNeDB.remove(query, { multi: false });
        return { deletedCount: count };
    }
};

// Unified Transaction Wrapper
const Transaction = {
    async create(doc) {
        if (isMongoConnected && mongoose.connection.readyState === 1) {
            return await MongoTransaction.create(doc);
        }
        return await transactionsNeDB.insert({ ...doc, createdAt: doc.createdAt || new Date() });
    },

    async insertMany(docs) {
        if (isMongoConnected && mongoose.connection.readyState === 1) {
            return await MongoTransaction.insertMany(docs);
        }
        return await transactionsNeDB.insert(docs);
    },

    find(query = {}) {
        if (isMongoConnected && mongoose.connection.readyState === 1) {
            return MongoTransaction.find(query);
        }
        const p = transactionsNeDB.find(query);
        p.lean = async () => await p;
        return p;
    },

    async findOne(query) {
        if (isMongoConnected && mongoose.connection.readyState === 1) {
            return await MongoTransaction.findOne(query);
        }
        return await transactionsNeDB.findOne(query);
    },

    async deleteOne(query) {
        if (isMongoConnected && mongoose.connection.readyState === 1) {
            return await MongoTransaction.deleteOne(query);
        }
        const count = await transactionsNeDB.remove(query, { multi: false });
        return { deletedCount: count };
    },

    async deleteMany(query) {
        if (isMongoConnected && mongoose.connection.readyState === 1) {
            return await MongoTransaction.deleteMany(query);
        }
        const count = await transactionsNeDB.remove(query, { multi: true });
        return { deletedCount: count };
    }
};

module.exports = { Company, Transaction, setMongoConnected, getMongoConnected };
