import fs from 'fs';
import path from 'path';

export interface LogReport {
    critical: number;
    warning: number;
    info: number;
    recentErrors: string[];
}

export class LogParserDaemon {
    private readonly logFilePath: string;

    constructor() {
        // Points to the server.log in the root directory
        this.logFilePath = path.resolve(process.cwd(), 'server.log');
    }

    public analyzeLogs(): LogReport {
        const report: LogReport = {
            critical: 0,
            warning: 0,
            info: 0,
            recentErrors: []
        };

        if (!fs.existsSync(this.logFilePath)) {
            return report;
        }

        try {
            // Read last 1000 lines or read synchronously
            const logContent = fs.readFileSync(this.logFilePath, 'utf-8');
            const lines = logContent.split('\n').filter(l => l.trim().length > 0);

            // Consider only the last 500 lines for the report
            const recentLines = lines.slice(-500);

            recentLines.forEach(line => {
                const lowerLine = line.toLowerCase();
                if (lowerLine.includes('error') || lowerLine.includes('exception') || lowerLine.includes('fail')) {
                    report.critical++;
                    if (report.recentErrors.length < 5) {
                        report.recentErrors.push(`[CRÍTICO] ${line.substring(0, 100)}...`);
                    }
                } else if (lowerLine.includes('warn')) {
                    report.warning++;
                } else {
                    report.info++;
                }
            });

        } catch (error) {
            console.error('Sentinel LogParser Error:', error);
        }

        return report;
    }
}
