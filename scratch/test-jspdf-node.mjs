import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import fs from 'fs';

try {
    console.log("Initializing jsPDF...");
    const doc = new jsPDF();
    
    doc.text("Reporte Mensual de Pruebas", 14, 15);
    
    console.log("Generating AutoTable...");
    autoTable(doc, {
        startY: 20,
        head: [['Nombre', 'Fecha', 'Ganancia']],
        body: [
            ['Juan Perez', '2026-05-10', '50 DP'],
            ['Maria Gomez', '2026-05-12', '50 DP']
        ]
    });

    console.log("Outputting PDF...");
    const ab = doc.output('arraybuffer');
    const buf = Buffer.from(ab);
    fs.writeFileSync('scratch/test_node_pdf.pdf', buf);
    console.log("PDF generated successfully at scratch/test_node_pdf.pdf!");
} catch (e) {
    console.error("PDF generation failed:", e);
}
