const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

const ledgerController = require('../controllers/ledgerController');

router.post('/companies', ledgerController.createCompany);
router.get('/companies', ledgerController.getCompanies);
router.delete('/companies/:id', ledgerController.deleteCompany);

router.post('/transactions', ledgerController.addTransaction);
router.get('/transactions', ledgerController.getTransactions);
router.delete('/transactions/:id', ledgerController.deleteTransaction);

router.post('/transactions/upload', upload.single('excel'), ledgerController.uploadExcel);

module.exports = router;
