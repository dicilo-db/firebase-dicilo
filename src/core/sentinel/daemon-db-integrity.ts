import { adminDb } from '@/lib/firebase-admin';

export interface DbIntegrityReport {
    status: 'ONLINE' | 'OFFLINE' | 'DEGRADED';
    checkedCollections: string[];
    errors: string[];
}

export class DbIntegrityDaemon {
    public async checkIntegrity(): Promise<DbIntegrityReport> {
        const report: DbIntegrityReport = {
            status: 'ONLINE',
            checkedCollections: ['users', 'clients', 'categories', 'trading_offers'],
            errors: []
        };

        try {
            for (const collectionName of report.checkedCollections) {
                try {
                    // Test reading 1 document from each critical collection
                    const snapshot = await adminDb.collection(collectionName).limit(1).get();
                    if (snapshot.empty) {
                        report.errors.push(`Colección [${collectionName}] está vacía o inaccesible.`);
                    }
                } catch (colErr: any) {
                    report.errors.push(`Error al acceder a [${collectionName}]: ${colErr.message}`);
                }
            }

            if (report.errors.length === report.checkedCollections.length) {
                report.status = 'OFFLINE';
            } else if (report.errors.length > 0) {
                report.status = 'DEGRADED';
            }

        } catch (error: any) {
            report.status = 'OFFLINE';
            report.errors.push(`Fallo general en la conexión a la base de datos: ${error.message}`);
        }

        return report;
    }
}
