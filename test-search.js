const http = require('http');

http.get('http://localhost:3000/api/search/nearest?q=tes', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log(data.substring(0, 500)));
}).on('error', err => console.log(err));
