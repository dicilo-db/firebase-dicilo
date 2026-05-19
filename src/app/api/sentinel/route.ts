import { NextResponse } from 'next/server';

import { FileWatcherDaemon } from '@/core/sentinel/daemon-file-watcher';
import { LogParserDaemon } from '@/core/sentinel/daemon-log-parser';
import { DbIntegrityDaemon } from '@/core/sentinel/daemon-db-integrity';
import { SynthesisEngine } from '@/core/sentinel/synthesis-engine';

import { getAdminAuth } from '@/lib/firebase-admin';

export async function GET(req: Request) {
    const authHeader = req.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json({ error: 'Acceso Denegado. Se requiere autenticación.' }, { status: 403 });
    }

    const token = authHeader.split('Bearer ')[1];

    try {
        const decodedToken = await getAdminAuth().verifyIdToken(token);
        const role = decodedToken.role;

        if (role !== 'admin' && role !== 'superadmin') {
            return NextResponse.json({ error: 'Acceso Denegado. Se requieren permisos de administrador.' }, { status: 403 });
        }
    } catch (e) {
        return NextResponse.json({ error: 'Token inválido o expirado.' }, { status: 403 });
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
