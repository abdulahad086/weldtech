import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000' : 'https://weldt.onrender.com');
import * as XLSX from 'xlsx';
import SplitText from '../components/SplitText';
import Galaxy from '../components/Galaxy';
import './Dashboard.css';

export default function Dashboard() {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState('');
  const [transactions, setTransactions] = useState([]);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [formData, setFormData] = useState({ 
    date: '', 
    billNo: '', 
    itemDescription: '', 
    quantity: '', 
    price: '', 
    credit: '' 
  });
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

  // Live Auto-Calculations
  const qtyVal = Number(formData.quantity) || 0;
  const priceVal = Number(formData.price) || 0;
  const calcGst = (qtyVal && priceVal) ? Math.round(priceVal * 0.18 * 100) / 100 : 0;
  const calcPriceWithGst = (qtyVal && priceVal) ? Math.round((priceVal + calcGst) * 100) / 100 : 0;
  const calcSubtotal = (qtyVal && priceVal) ? Math.round((qtyVal * calcPriceWithGst) * 100) / 100 : 0;
  const calcTaxPointOne = (qtyVal && priceVal) ? Math.round((calcSubtotal * 0.001) * 100) / 100 : 0;
  const calcFinalTotal = (qtyVal && priceVal) ? Math.round((calcSubtotal + calcTaxPointOne) * 100) / 100 : 0;

  const handleAddTrans = async (e) => {
    e.preventDefault();
    if (!formData.quantity && !formData.price && !formData.credit) {
      return alert('Enter Quantity & Price OR Credit amount');
    }
    if (selectedCompany === 'all') return alert('Please select a specific company to add a transaction.');
    
    const company = companies.find(c => c._id === selectedCompany);
    const customerName = company ? company.name : '';

    await axios.post(`${API_URL}/api/ledger/transactions`, { 
      ...formData, 
      customerName, 
      companyId: selectedCompany 
    });

    setFormData({ date: '', billNo: '', itemDescription: '', quantity: '', price: '', credit: '' });
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
      fetchCompanies();
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

  const formatDateDisplay = (dateStr) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = String(d.getFullYear()).slice(-2); // e.g. 26 for 2026
    return `${day}.${month}.${year}`;
  };

  const handleExport = () => {
    const ws = XLSX.utils.json_to_sheet(transactions.map(t => {
      const data = {
        'Date': formatDateDisplay(t.date),
        'Invoice No': t.billNo || '',
        'Item / Particulars': t.itemDescription || t.customerName || '',
        'Quantity': t.quantity || 0,
        'Price': t.price || 0,
        'GST (18%)': t.gst || 0,
        'Price with GST': t.priceWithGst || 0,
        'Total Subtotal': t.subtotal || 0,
        'Tax (0.1%)': t.taxPointOne || 0,
        'Total Amount': t.finalAmount || t.debit || 0,
        'Credit': t.credit || 0,
        'Balance': t.balance || 0
      };
      if (selectedCompany === 'all') {
        data['Company'] = t.companyName;
      }
      return data;
    }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Ledger");
    XLSX.writeFile(wb, "WeldT_Ledger_Export.xlsx");
  };

  const finalBalanceDisplay = () => {
    if (selectedCompany === 'all') {
      const latestBalances = {};
      // Calculate latest balances by tracking company totals
      transactions.forEach(t => {
        latestBalances[t.companyId] = t.balance;
      });
      const totalBalance = Object.values(latestBalances).reduce((a, b) => a + b, 0);
      return `Global Total Balance: ${totalBalance.toLocaleString()}`;
    } else {
      const b = transactions.length > 0 ? transactions[0].balance : 0; // Index 0 is newest row in Z->A order
      return `Final Balance: ${b.toLocaleString()}`;
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
      <div className="weld-dashboard" style={{ maxWidth: '1400px', margin: 'auto', padding: '20px', fontFamily: 'sans-serif' }}>
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
                navigate('/login');
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
        
        <div className="glass-box no-print" style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
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

        <div className="glass-box no-print" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <input type="date" value={dateRange.start} onChange={e => setDateRange({...dateRange, start: e.target.value})} />
          <input type="date" value={dateRange.end} onChange={e => setDateRange({...dateRange, end: e.target.value})} />
          <button onClick={() => setDateRange({start:'', end:''})}>Clear Dates</button>
          <button onClick={handleExport} style={{ background: '#2563eb', fontWeight: 'bold' }}>📥 Export Excel (Exact Format)</button>
          <button onClick={() => window.print()}>Print</button>
        </div>

        <div className="glass-box" style={{ fontSize: '1.2em', fontWeight: 'bold' }}>
          {finalBalanceDisplay()}
        </div>

        {selectedCompany !== 'all' && (
          <>
            <div className="glass-box no-print">
              <h4 style={{ margin: '0 0 10px 0' }}>Add Transaction Entry</h4>
              <form onSubmit={handleAddTrans} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                <input type="date" required value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} title="Date" />
                <input type="text" placeholder="Invoice No" value={formData.billNo} onChange={e => setFormData({...formData, billNo: e.target.value})} style={{ width: '110px' }} />
                <input type="text" placeholder="Item / Description (e.g. FORTEX 7018 NO.10)" value={formData.itemDescription} onChange={e => setFormData({...formData, itemDescription: e.target.value})} style={{ minWidth: '220px', flex: 1 }} />
                <input type="number" placeholder="Quantity" value={formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value})} style={{ width: '100px' }} />
                <input type="number" placeholder="Price" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} style={{ width: '100px' }} />
                <input type="number" placeholder="Credit (Payment)" value={formData.credit} onChange={e => setFormData({...formData, credit: e.target.value})} disabled={formData.quantity || formData.price} style={{ width: '130px' }} />
                <button type="submit" style={{ background: '#16a34a', color: 'white', fontWeight: 'bold', padding: '8px 20px' }}>Add Entry</button>
              </form>

              {qtyVal > 0 && priceVal > 0 && (
                <div style={{ marginTop: '12px', background: 'rgba(0,0,0,0.2)', padding: '10px 15px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', gap: '15px', flexWrap: 'wrap', fontSize: '0.9em' }}>
                  <div><strong>GST (18%):</strong> {calcGst.toLocaleString()}</div>
                  <div><strong>Price + GST:</strong> {calcPriceWithGst.toLocaleString()}</div>
                  <div><strong>Subtotal:</strong> {calcSubtotal.toLocaleString()}</div>
                  <div><strong>Tax (0.1%):</strong> {calcTaxPointOne.toLocaleString()}</div>
                  <div style={{ color: '#4ade80', fontWeight: 'bold' }}><strong>Total Amount:</strong> {calcFinalTotal.toLocaleString()}</div>
                </div>
              )}
            </div>

            <div className="glass-box no-print">
              <h4 style={{ margin: '0 0 10px 0' }}>Upload Excel</h4>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <input type="file" accept=".xlsx" onChange={e => setFile(e.target.files[0])} style={{border: 'none', background: 'transparent'}} />
                <button onClick={handleUpload}>Upload Data</button>
              </div>
            </div>
          </>
        )}

        <div style={{ overflowX: 'auto', borderRadius: '8px' }}>
          <table width="100%" cellPadding="8">
            <thead>
              <tr>
                {selectedCompany === 'all' && <th>Company</th>}
                <th>Date (Z-A)</th>
                <th>Invoice No</th>
                <th>Item / Particulars</th>
                <th>Qty</th>
                <th>Price</th>
                <th>GST (18%)</th>
                <th>Price + GST</th>
                <th>Subtotal</th>
                <th>Tax (0.1%)</th>
                <th>Total Amount</th>
                <th>Credit</th>
                <th>Balance</th>
                <th className="no-print">Actions</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((t, idx) => (
                <tr key={t._id || idx}>
                  {selectedCompany === 'all' && <td>{t.companyName}</td>}
                  <td style={{ whiteSpace: 'nowrap' }}>{formatDateDisplay(t.date)}</td>
                  <td>{t.billNo || '-'}</td>
                  <td>{t.itemDescription || t.customerName || '-'}</td>
                  <td>{t.quantity || '-'}</td>
                  <td>{t.price ? t.price.toLocaleString() : '-'}</td>
                  <td>{t.gst ? t.gst.toLocaleString() : '-'}</td>
                  <td>{t.priceWithGst ? t.priceWithGst.toLocaleString() : '-'}</td>
                  <td>{t.subtotal ? t.subtotal.toLocaleString() : '-'}</td>
                  <td>{t.taxPointOne ? t.taxPointOne.toLocaleString() : '-'}</td>
                  <td style={{ color: '#4ade80', fontWeight: 'bold' }}>{t.finalAmount ? t.finalAmount.toLocaleString() : (t.debit ? t.debit.toLocaleString() : '-')}</td>
                  <td style={{ color: '#f87171' }}>{t.credit > 0 ? t.credit.toLocaleString() : '-'}</td>
                  <td style={{ fontWeight: 'bold' }}>{t.balance ? t.balance.toLocaleString() : 0}</td>
                  <td className="no-print">
                    <button 
                      onClick={() => handleDeleteTrans(t._id)}
                      style={{ background: 'rgba(255,0,0,0.3)', color: 'white', cursor: 'pointer', padding: '4px 8px' }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {transactions.length === 0 && (
                <tr>
                  <td colSpan={selectedCompany === 'all' ? 14 : 13} style={{ textAlign: 'center' }}>No transactions found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}