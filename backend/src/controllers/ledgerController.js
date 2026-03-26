const { Company, Transaction } = require('../models/Ledger');
const xlsx = require('xlsx');

exports.createCompany = async (req, res) => {
  try {
    const company = await Company.create({ name: req.body.name, createdAt: new Date() });
    res.status(201).json(company);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Company with this name already exists' });
    }
    res.status(400).json({ error: error.message });
  }
};

exports.getCompanies = async (req, res) => {
  try {
    const companies = await Company.find({}).lean();
    res.json(companies);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteCompany = async (req, res) => {
  try {
    const masterPassword = req.headers['x-admin-password'];
    if (masterPassword !== 'admin123') {
      return res.status(401).json({ error: 'Unauthorized: Invalid master password' });
    }
    
    const companyId = req.params.id;
    // Remove the company
    const numRemovedCompany = await Company.deleteOne({ _id: companyId });
    // Remove all associated transactions
    const numRemovedTransactions = await Transaction.deleteMany({ companyId });
    
    if (numRemovedCompany.deletedCount > 0) {
      res.json({ success: true, msg: 'Company and associated transactions deleted', numRemovedTransactions: numRemovedTransactions.deletedCount });
    } else {
      res.status(404).json({ error: 'Company not found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.addTransaction = async (req, res) => {
  try {
    const { companyId, date, customerName, billNo, debit, credit } = req.body;
    const trans = await Transaction.create({
      companyId, date, customerName, billNo, 
      debit: Number(debit) || 0, 
      credit: Number(credit) || 0, 
      createdAt: new Date()
    });
    res.status(201).json(trans);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.deleteTransaction = async (req, res) => {
  try {
    const masterPassword = req.headers['x-admin-password'];
    if (masterPassword !== 'admin123') {
      return res.status(401).json({ error: 'Unauthorized: Invalid master password' });
    }
    
    // nedb-promises remove returns the number of deleted documents
    const numRemoved = await Transaction.deleteOne({ _id: req.params.id });
    if (numRemoved.deletedCount > 0) {
      res.json({ success: true, msg: 'Transaction deleted' });
    } else {
      res.status(404).json({ error: 'Transaction not found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getTransactions = async (req, res) => {
  try {
    const { companyId, startDate, endDate } = req.query;

    if (!companyId || companyId === 'undefined') return res.json([]);

    let query = {};
    if (companyId !== 'all') {
      query.companyId = companyId;
    }

    let transactions = await Transaction.find(query).lean();
    transactions.sort((a,b) => new Date(a.date) - new Date(b.date));
    
    const companyBalances = {};
    let dataWithBalance = transactions.map(t => {
      if (!companyBalances[t.companyId]) {
        companyBalances[t.companyId] = 0;
      }
      let d = Number(t.debit) || 0;
      let c = Number(t.credit) || 0;
      companyBalances[t.companyId] += (d - c);
      return { ...t, balance: companyBalances[t.companyId] };
    });

    if (companyId === 'all') {
      const companies = await Company.find({}).lean();
      const companyMap = {};
      companies.forEach(c => {
        const idStr = c._id ? c._id.toString() : c.id;
        companyMap[idStr] = c.name;
      });
      dataWithBalance = dataWithBalance.map(t => ({
        ...t,
        companyName: companyMap[t.companyId] || 'Unknown Company'
      }));
    }

    if (startDate && endDate) {
      const s = new Date(startDate).setHours(0,0,0,0);
      const e = new Date(endDate).setHours(23,59,59,999);
      dataWithBalance = dataWithBalance.filter(t => {
        const time = new Date(t.date).getTime();
        return time >= s && time <= e;
      });
    }

    res.json(dataWithBalance.reverse());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.uploadExcel = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ msg: 'No file uploaded' });
    const companyId = req.body.companyId;
    
    const workbook = xlsx.read(req.file.buffer, { type: 'buffer', cellDates: true });
    const sheetName = workbook.SheetNames[0];
    const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    const docs = data.map(row => {
      let parsedDate;
      const rowDate = row.Date || row.date;
      if (!rowDate) { 
        parsedDate = new Date().toISOString(); 
      } else if (typeof rowDate === 'number') {
        parsedDate = new Date(Math.round((rowDate - 25569) * 86400 * 1000)).toISOString();
      } else {
        const d = new Date(rowDate);
        parsedDate = isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
      }
      return {
        companyId,
        date: parsedDate,
        customerName: row.Customer || row.customerName || '',
        billNo: row.BillNo || row.billNo || '',
        debit: Number(row.Debit || row.debit) || 0,
        credit: Number(row.Credit || row.credit) || 0,
        createdAt: new Date()
      };
    });

    if (docs.length > 0) {
      await Transaction.insertMany(docs);
    }
    res.json({ msg: 'Excel uploaded!', count: docs.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
