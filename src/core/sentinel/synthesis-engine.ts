import fs from 'fs';
import path from 'path';

export class SynthesisEngine {
    public generateSynthesis(fileChanges: string[], logs: any, dbStatus: any): string {
        let synthesis = 'Síntesis de Observabilidad Antigravity Sentinel:\n\n';

        // 1. File Changes Synthesis
        if (fileChanges.length === 0) {
            synthesis += 'No se han detectado cambios recientes en los archivos del sistema (Módulo File-Watcher).\n';
        } else {
            synthesis += `Se han detectado ${fileChanges.length} modificaciones en los archivos del sistema desde el último snapshot.\n`;
            synthesis += `Cambios principales:\n${fileChanges.slice(0, 5).join('\n')}${fileChanges.length > 5 ? '\n...y más.' : ''}\n`;
        }

        synthesis += '\n';

        // 2. Log Parser Synthesis
        synthesis += `El Log-Parser registra ${logs.critical} eventos críticos, ${logs.warning} advertencias y ${logs.info} eventos informativos en el registro reciente.\n`;
        if (logs.critical > 0) {
            synthesis += `Atención requerida: Se han capturado fallos críticos recientes.\n`;
        }

        synthesis += '\n';

        // 3. DB Integrity Synthesis
        if (dbStatus.status === 'ONLINE') {
            synthesis += 'El módulo DB-Integrity confirma que la conexión con la base de datos es estable y las colecciones principales están accesibles.\n';
        } else {
            synthesis += `El módulo DB-Integrity reporta un estado [${dbStatus.status}]. Errores detectados: ${dbStatus.errors.join(' | ')}\n`;
        }

        return synthesis;
    }

    public generateMermaidMap(): string {
        try {
            const pkgPath = path.resolve(process.cwd(), 'package.json');
            const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
            
            let mermaid = 'graph TD;\n';
            mermaid += '  Portal[Dicilo Portal]:::main;\n';

            const deps = pkg.dependencies || {};
            let count = 0;
            
            // Limit to 15 major dependencies for visual clarity
            for (const [key, _] of Object.entries(deps)) {
                if (count >= 15) break;
                // Clean key names for mermaid
                const safeKey = key.replace(/[^a-zA-Z0-9]/g, '_');
                mermaid += `  Portal --> ${safeKey}[${key}];\n`;
                count++;
            }

            mermaid += '\n  classDef main fill:#f9f,stroke:#333,stroke-width:4px;\n';
            return mermaid;
        } catch (e) {
            return 'graph TD;\n  Error[Error loading dependencies]';
        }
    }
}
