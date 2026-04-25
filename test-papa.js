const Papa = require('papaparse');
const csv = 'Nombre,Dirección,Teléfono\nBücherhalle Barmbek,"Poppenhusenstraße 12, 22305 Hamburg",+49 40 291591';
const res = Papa.parse(csv, { header: true });
console.log(JSON.stringify(res, null, 2));
