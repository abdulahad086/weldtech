require('dotenv').config();
const mongoose = require('mongoose');
const Datastore = require('nedb-promises');
const { Company, Transaction } = require('./src/models/Ledger');

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {})
  .then(() => console.log('Connected to MongoDB for Migration'))
  .catch(err => console.error('MongoDB connection error:', err));

const migrate = async () => {
  try {
    const companiesDB = Datastore.create({ filename: './db/companies.db', autoload: true });
    const transactionsDB = Datastore.create({ filename: './db/transactions.db', autoload: true });

    const localCompanies = await companiesDB.find({});
    const localTransactions = await transactionsDB.find({});

    console.log(`Found ${localCompanies.length} companies and ${localTransactions.length} transactions locally.`);

    if (localCompanies.length > 0) {
      for (const comp of localCompanies) {
        const exist = await Company.findOne({ name: comp.name });
        let newCompanyId = comp._id;
        if (!exist) {
          const c = await Company.create({ name: comp.name, createdAt: comp.createdAt });
          newCompanyId = c._id.toString();
        } else {
          newCompanyId = exist._id.toString();
        }
        // Update all related transactions to the new Mongoose ID format if needed. Mongoose uses 24-char ObjectIDs, so if the old NeDB ID was shorter, we map it. 
        // We'll just map old IDs to new docs
        for (const trans of localTransactions) {
          if (trans.companyId === comp._id) {
            trans.companyId = newCompanyId;
          }
        }
      }
      console.log('Companies migrated successfully.');
    }

    if (localTransactions.length > 0) {
      for (const trans of localTransactions) {
        // Prevent duplicate insertion blindly by checking if one with same date, amount, company exists
        const exist = await Transaction.findOne({ 
          companyId: trans.companyId, 
          date: trans.date, 
          debit: trans.debit, 
          credit: trans.credit 
        });
        if (!exist) {
          try {
            await Transaction.create({
              companyId: trans.companyId,
              date: trans.date,
              customerName: trans.customerName || '',
              billNo: trans.billNo || '',
              debit: trans.debit || 0,
              credit: trans.credit || 0,
              createdAt: trans.createdAt || new Date()
            });
          } catch(err) {
             console.log('Skipping transaction due to error: ', err.message);
          }
        }
      }
      console.log('Transactions migrated successfully.');
    }

    console.log('Migration complete. You can safely close this script if it hangs.');
    process.exit(0);
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
};

migrate();
