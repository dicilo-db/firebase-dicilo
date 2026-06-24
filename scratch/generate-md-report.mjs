import fs from 'fs';

const data = JSON.parse(fs.readFileSync('scratch/audit_results_may_2026.json', 'utf8'));
const { report, referrerAggregates, inconsistencies } = data;

let md = `# Reporte de Auditoría de Registros y Pagos - Mayo 2026\n\n`;
md += `Este reporte analiza todos los usuarios registrados entre el **01.05.2026** y el **31.05.2026**, identificando sus referentes, los pagos esperados (según las tarifas por rol) y los pagos reales registrados en la base de datos (\`wallet_transactions\`).\n\n`;

md += `## Resumen General de Mayo 2026\n`;
md += `- **Total de nuevos registros en el período:** ${report.length}\n`;
md += `- **Registros con patrocinador (referente):** ${report.filter(r => r.referrer).length}\n`;
md += `- **Registros orgánicos (sin referente):** ${report.filter(r => !r.referrer).length}\n`;
md += `- **Referentes activos en este período:** ${Object.keys(referrerAggregates).length}\n`;

// Calculate how many have actually received transactions
let unpaidRegistrations = 0;
report.forEach(item => {
    if (item.referrer && (!item.payment || item.payment.paidDP === 0)) {
        unpaidRegistrations++;
    }
});
md += `- **Registros sin transacciones de puntos encontradas:** ${unpaidRegistrations}\n\n`;

md += `## 1. Resumen de Pagos por Referente\n`;
md += `A continuación se detallan los referentes activos durante mayo de 2026. Se muestran:\n`;
md += `- **Invitados:** Total de personas registradas en mayo que usaron su enlace/código.\n`;
md += `- **DP Pagado (Literal):** Los puntos que se registraron efectivamente en las transacciones de su billetera en el sistema.\n`;
md += `- **DP Calculado MLM:** El equivalente calculado para el reporte (Team Leader = 5.0, Freelancer/Otros = 2.5 por invitado).\n`;
md += `- **Efectivo Odo ($ / EUR):** El total en efectivo que se le debe pagar al referente por estas recomendaciones (Team Leader = €0.50, Freelancer/Otros = €0.25 por invitado).\n\n`;

md += `| Referente | Rol | Código | Invitados | DP Pagado (Literal) | DP Calculado MLM | Efectivo/EUR Esperado | Efectivo Real Pagado | Estado DP | estado Efectivo |\n`;
md += `| :--- | :--- | :--- | :---: | :---: | :---: | :---: | :---: | :--- | :--- |\n`;

for (const [id, agg] of Object.entries(referrerAggregates)) {
    const totalInvited = agg.invitedUsers.length;
    const isPaid = agg.totalPaidDP > 0;
    
    const dpStatus = isPaid ? `✅ Acreditado (${agg.totalPaidDP} DP)` : `❌ No acreditado`;
    // Cash is paid manually (no database transactions usually, except for 4 historical business ones)
    const cashStatus = agg.totalPaidEUR > 0 ? `✅ Pagado (€${agg.totalPaidEUR.toFixed(2)})` : `⏳ Pendiente de Pago (€${agg.totalExpectedEUR.toFixed(2)} por pagar)`;

    md += `| **${agg.referrer.name}** | \`${agg.referrer.role}\` | \`${agg.referrer.code}\` | ${totalInvited} | **${agg.totalPaidDP} DP** | ${agg.totalExpectedDP.toFixed(1)} | **€${agg.totalExpectedEUR.toFixed(2)}** | €${agg.totalPaidEUR.toFixed(2)} | ${dpStatus} | ${cashStatus} |\n`;
}

md += `\n> [!NOTE]\n`;
md += `> **Tasas de cálculo de comisiones (MLM):**\n`;
md += `> - **Team Leader, Admin, Superadmin, Team Office:** €0.50 y 5.0 DP calculados por invitado.\n`;
md += `> - **Freelancer y otros:** €0.25 y 2.5 DP calculados por invitado.\n`;
md += `> \n`;
md += `> *Nota: En la base de datos real, los puntos se acreditan como 30 DP o 50 DP literales al momento del registro.*\n\n`;

md += `## 2. Incoherencias y Registros sin Transacciones Asociadas\n`;

const actualInconsistencies = report.filter(item => {
    if (item.referrer) {
        // Referral was not paid points
        return item.payment.paidDP === 0;
    } else {
        // Registered with code but referredBy is empty
        return !!item.hasReferrerCode;
    }
});

if (actualInconsistencies.length === 0) {
    md += `✅ **No se detectaron incoherencias.** Todos los registros con referentes tienen sus transacciones de puntos correspondientes creadas en la base de datos.\n`;
} else {
    md += `⚠️ Se encontraron **${actualInconsistencies.length} registros** que presentan incoherencias o falta de pago de puntos:\n\n`;
    
    actualInconsistencies.forEach((inc, idx) => {
        md += `### Incoherencia #${idx + 1}: ${inc.name}\n`;
        md += `- **ID de Usuario:** \`${inc.uid}\`\n`;
        md += `- **Email:** \`${inc.email}\`\n`;
        md += `- **Fecha de Registro:** ${inc.createdAt.split('T')[0]}\n`;
        if (inc.referrer) {
            md += `- **Referente:** ${inc.referrer.name} (\`${inc.referrer.email}\` - Rol: \`${inc.referrer.role}\`)\n`;
            md += `- **Fallo:** No se encontró la transacción de puntos (\`REFERRAL_REWARD\`) para este invitado en la billetera de su referente.\n`;
        } else {
            md += `- **Fallo:** Se registró usando el código de referente \`${inc.hasReferrerCode}\`, pero el campo \`referredBy\` está vacío en su perfil.\n`;
        }
        md += `\n`;
    });
}

md += `\n## 3. Listado Completo de Invitaciones y Registros de Mayo 2026\n`;
md += `A continuación se muestra la lista cronológica de todos los registros en mayo:\n\n`;
md += `| Fecha | Invitado | Email | Referente | Código de Referente Usado | DP Transacción Real |\n`;
md += `| :--- | :--- | :--- | :--- | :---: | :---: |\n`;

const sortedReport = [...report].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
for (const item of sortedReport) {
    const refName = item.referrer ? `**${item.referrer.name}** (\`${item.referrer.role}\`)` : '*Orgánico (Sin referente)*';
    const transactionPoints = item.payment ? `${item.payment.paidDP} DP` : 'N/A';
    md += `| ${item.createdAt.split('T')[0]} | ${item.name} | \`${item.email}\` | ${refName} | \`${item.hasReferrerCode || 'N/A'}\` | **${transactionPoints}** |\n`;
}

const artifactPath = '/Users/niloescolar/.gemini/antigravity-ide/brain/867a9de9-b3f3-4a29-84b8-fef3774f5ea3/audit_results.md';
fs.writeFileSync(artifactPath, md);
console.log(`Reporte generado exitosamente en ${artifactPath}`);
