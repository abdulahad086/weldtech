import React, { useState, useEffect } from 'react';
import axios from 'axios';
const API_URL = import.meta.env.VITE_API_URL || 'https://weldt.onrender.com';
import * as XLSX from 'xlsx';
import SplitText from '../components/SplitText';
import Galaxy from '../components/Galaxy';
import './Dashboard.css';

export default function Dashboard() {
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState('');
  const [transactions, setTransactions] = useState([]);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [formData, setFormData] = useState({ date: '', billNo: '', debit: '', credit: '' });
  const [file, setFile] = useState(null);

  useEffect(() => { fetchCompanies(); }, []);
  useEffect(() => { if (selectedCompany) fetchTransactions(); }, [selectedCompany, dateRange]);

  const fetchCompanies = async () => {
    const { data } = await axios.get(`${API_URL}/api/ledger/companies`);
    setCompanies(data);
    if(data.length && !selectedCompany) setSelectedCompany(data[0]._id);
  };

  const fetchTransactions = async () => {
    const { data } = await axios.get(`${API_URL}/api/ledger/transactions?companyId=${selectedCompany}&startDate=${dateRange.start}&endDate=${dateRange.end}`);
    setTransactions(data);
  };

  const handleAddTrans = async (e) => {
    e.preventDefault();
    if (!formData.debit && !formData.credit) return alert('Enter Debit or Credit');
    if (selectedCompany === 'all') return alert('Please select a specific company to add a transaction.');
    
    const company = companies.find(c => c._id === selectedCompany);
    const customerName = company ? company.name : '';

    await axios.post(`${API_URL}/api/ledger/transactions`, { ...formData, customerName, companyId: selectedCompany });
    setFormData({ date: '', billNo: '', debit: '', credit: '' });
    fetchTransactions();
  };

  const handleDeleteTrans = async (id) => {
    const pwd = prompt('Data is critical. Enter admin password to delete:');
    if (!pwd) return;
    try {
      await axios.delete(`${API_URL}/api/ledger/transactions/${id}`, {
        headers: { 'x-admin-password': pwd }
      });
      fetchTransactions();
    } catch (err) {
      if (err.response && err.response.status === 401) {
        alert('Incorrect admin password!');
      } else {
        alert('Error deleting transaction.');
      }
    }
  };

  const handleDeleteCompany = async () => {
    if (selectedCompany === 'all') return;
    const pwd = prompt('Are you sure you want to delete this COMPANY and ALL its transactions? Enter admin password to confirm or Cancel:');
    if (!pwd) return;
    try {
      await axios.delete(`${API_URL}/api/ledger/companies/${selectedCompany}`, {
        headers: { 'x-admin-password': pwd }
      });
      setSelectedCompany('all');
      fetchCompanies(); // Re-fetch companies
    } catch (err) {
      if (err.response && err.response.status === 401) {
        alert('Incorrect admin password!');
      } else {
        alert('Error deleting company.');
      }
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    if (selectedCompany === 'all') return alert('Please select a specific company to upload data to.');

    const formDataObj = new FormData();
    formDataObj.append('excel', file);
    formDataObj.append('companyId', selectedCompany);
    await axios.post(`${API_URL}/api/ledger/transactions/upload`, formDataObj, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    setFile(null);
    fetchTransactions();
  };

  const handleExport = () => {
    const ws = XLSX.utils.json_to_sheet(transactions.map(t => {
      const data = {
        Date: new Date(t.date).toLocaleDateString(),
        Customer: t.customerName,
        'Bill No': t.billNo,
        Debit: t.debit,
        Credit: t.credit,
        Balance: t.balance
      };
      if (selectedCompany === 'all') {
        data.Company = t.companyName;
      }
      return data;
    }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Ledger");
    XLSX.writeFile(wb, "LedgerData.xlsx");
  };

  const finalBalanceDisplay = () => {
    if (selectedCompany === 'all') {
      // Calculate total final balance across all companies by summing the unique latest balances
      const latestBalances = {};
      transactions.forEach(t => {
        if (latestBalances[t.companyId] === undefined) {
          latestBalances[t.companyId] = t.balance; // We take the first one we see (which is the latest because array is reversed)
        }
      });
      const totalBalance = Object.values(latestBalances).reduce((a, b) => a + b, 0);
      return `Global Total Balance: ${totalBalance}`;
    } else {
      const b = transactions.length > 0 ? transactions[0].balance : 0;
      return `Final Balance: ${b}`;
    }
  };

  return (
    <>
      <div className="galaxy-bg-fixed">
        <Galaxy 
          mouseRepulsion
          mouseInteraction
          density={2.4}
          glowIntensity={0.3}
          saturation={0}
          hueShift={140}
          twinkleIntensity={0.3}
          rotationSpeed={0.1}
          repulsionStrength={2}
          autoCenterRepulsion={0}
          starSpeed={0.5}
          speed={1}
        />
      </div>
      <div className="weld-dashboard" style={{ maxWidth: '900px', margin: 'auto', padding: '20px', fontFamily: 'sans-serif' }}>
        <div className="weld-header">
          <SplitText
            text="Weld Tech"
            className="weld-title"
            delay={50}
            duration={1.25}
            ease="power3.out"
            splitType="chars"
            from={{ opacity: 0, y: 40 }}
            to={{ opacity: 1, y: 0 }}
            threshold={0.1}
            rootMargin="-100px"
            textAlign="left"
            tag="h2"
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <img src="/logo.png" alt="Weld Tech Logo" className="weld-logo" />
            <button 
              onClick={() => {
                localStorage.removeItem('isAuthenticated');
                window.location.href = '/login';
              }}
              style={{
                padding: '8px 16px',
                background: 'rgba(255, 0, 0, 0.4)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(5px)',
                color: 'white',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 'bold',
                transition: 'background 0.3s'
              }}
              onMouseOver={(e) => e.target.style.background = 'rgba(255, 0, 0, 0.6)'}
              onMouseOut={(e) => e.target.style.background = 'rgba(255, 0, 0, 0.4)'}
            >
              Logout
            </button>
          </div>
        </div>
        
        <div className="glass-box no-print" style={{ display: 'flex', gap: '20px' }}>
        <select value={selectedCompany} onChange={(e) => setSelectedCompany(e.target.value)} style={{ padding: '5px' }}>
          <option value="all">All Companies</option>
          {companies.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
        </select>
        <button onClick={() => {
           const name = prompt("Company Name:");
           if(name) {
             axios.post(`${API_URL}/api/ledger/companies`, {name})
               .then(fetchCompanies)
               .catch(err => {
                 console.error(err);
                 alert(err.response?.data?.error || err.message || "Error adding company");
               });
           }
        }}>Add Company</button>
        {selectedCompany !== 'all' && (
          <button 
            onClick={handleDeleteCompany} 
            style={{ background: 'rgba(255,0,0,0.3)', color: 'white', cursor: 'pointer' }}
          >
            Delete Selected Company
          </button>
        )}
      </div>

      <div className="glass-box no-print" style={{ display: 'flex', gap: '10px' }}>
        <input type="date" value={dateRange.start} onChange={e => setDateRange({...dateRange, start: e.target.value})} />
        <input type="date" value={dateRange.end} onChange={e => setDateRange({...dateRange, end: e.target.value})} />
        <button onClick={() => setDateRange({start:'', end:''})}>Clear Dates</button>
        <button onClick={handleExport}>Export Excel</button>
        <button onClick={() => window.print()}>Print</button>
      </div>

      <div className="glass-box" style={{ fontSize: '1.2em', fontWeight: 'bold' }}>
        {finalBalanceDisplay()}
      </div>

      {selectedCompany !== 'all' && (
        <>
          <div className="glass-box no-print">
            <h4>Add Transaction</h4>
            <form onSubmit={handleAddTrans} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <input type="date" required value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
              <input type="text" placeholder="Customer" value={companies.find(c => c._id === selectedCompany)?.name || ''} disabled style={{ background: 'rgba(255,255,255,0.05)', cursor: 'not-allowed' }} title="Selected from the dropdown above" />
              <input type="text" placeholder="Bill No" value={formData.billNo} onChange={e => setFormData({...formData, billNo: e.target.value})} />
              <input type="number" placeholder="Debit" value={formData.debit} onChange={e => setFormData({...formData, debit: e.target.value})} disabled={formData.credit} />
              <input type="number" placeholder="Credit" value={formData.credit} onChange={e => setFormData({...formData, credit: e.target.value})} disabled={formData.debit} />
              <button type="submit">Add</button>
            </form>
          </div>

          <div className="glass-box no-print">
            <h4>Upload Excel</h4>
            <input type="file" accept=".xlsx" onChange={e => setFile(e.target.files[0])} style={{border: 'none', background: 'transparent'}} />
            <button onClick={handleUpload}>Upload Data</button>
          </div>
        </>
      )}

      <table width="100%" cellPadding="8">
        <thead>
          <tr>
            {selectedCompany === 'all' && <th>Company</th>}
            <th>Date</th>
            <th>Customer</th>
            <th>Bill No</th>
            <th>Debit</th>
            <th>Credit</th>
            <th>Balance</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((t, idx) => (
            <tr key={t._id || idx}>
              {selectedCompany === 'all' && <td>{t.companyName}</td>}
              <td>{new Date(t.date).toLocaleDateString()}</td>
              <td>{t.customerName}</td>
              <td>{t.billNo}</td>
              <td style={{ color: '#4ade80' }}>{t.debit > 0 ? t.debit : '-'}</td>
              <td style={{ color: '#f87171' }}>{t.credit > 0 ? t.credit : '-'}</td>
              <td style={{ fontWeight: 'bold' }}>{t.balance}</td>
              <td>
                <button 
                  onClick={() => handleDeleteTrans(t._id)}
                  style={{ background: 'rgba(255,0,0,0.3)', color: 'white', cursor: 'pointer' }}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
          {transactions.length === 0 && (
            <tr>
              <td colSpan={selectedCompany === 'all' ? 8 : 7} style={{ textAlign: 'center' }}>No transactions found.</td>
            </tr>
          )}
        </tbody>
      </table>
      </div>
    </>
  );
}