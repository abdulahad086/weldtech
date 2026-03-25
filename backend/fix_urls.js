const fs = require('fs');
const pt = '/Users/mac/Desktop/WeldT/frontend/src/pages/Dashboard.jsx';
let content = fs.readFileSync(pt, 'utf8');

// Replace standard single quote string endpoints
content = content.replace(/'http:\/\/localhost:5000(.*?)'/g, "`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}$1`");

// Replace backtick string endpoints
content = content.replace(/`http:\/\/localhost:5000(.*?)`/g, "`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}$1`");

fs.writeFileSync(pt, content);
console.log('URLs updated!');
