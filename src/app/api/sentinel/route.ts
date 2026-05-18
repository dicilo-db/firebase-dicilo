import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { FileWatcherDaemon } from '@/core/sentinel/daemon-file-watcher';
import { LogParserDaemon } from '@/core/sentinel/daemon-log-parser';
import { DbIntegrityDaemon } from '@/core/sentinel/daemon-db-integrity';
import { SynthesisEngine } from '@/core/sentinel/synthesis-engine';

export async function GET(req: Request) {
    // Verificar seguridad (Zero-External Calls policy)
    // Interfaz instanciada solo si hay cookie adm_token
    const cookieStore = await cookies();
    const admToken = cookieStore.get('adm_token');

    if (!admToken) {
        return NextResponse.json({ error: 'Acceso Denegado. Se requiere autenticación de Administrador.' }, { status: 403 });
    }

    try {
        const fileWatcher = new FileWatcherDaemon();
        const logParser = new LogParserDaemon();
        const dbIntegrity = new DbIntegrityDaemon();
        const synthesisEngine = new SynthesisEngine();

        const fileData = fileWatcher.runScan();
        const logData = logParser.analyzeLogs();
        const dbData = await dbIntegrity.checkIntegrity();

        const synthesis = synthesisEngine.generateSynthesis(fileData.changes, logData, dbData);
        const mermaidMap = synthesisEngine.generateMermaidMap();

        return NextResponse.json({
            synthesis,
            mermaidMap,
            details: {
                files: fileData.changes,
                logs: logData,
                db: dbData
            }
        });
    } catch (error: any) {
        return NextResponse.json({ error: 'Error interno en Sentinel', details: error.message }, { status: 500 });
    }
}
