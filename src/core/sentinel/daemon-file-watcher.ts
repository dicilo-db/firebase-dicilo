import fs from 'fs';
import path from 'path';

export interface FileSnapshot {
    path: string;
    mtime: number;
}

export class FileWatcherDaemon {
    private readonly rootDir: string;
    private readonly stateFilePath: string;

    constructor() {
        this.rootDir = path.resolve(process.cwd(), 'src');
        this.stateFilePath = path.resolve(process.cwd(), 'src/core/sentinel/sentinel_state.json');
    }

    private getAllFiles(dirPath: string, arrayOfFiles: string[] = []): string[] {
        const files = fs.readdirSync(dirPath);

        files.forEach((file) => {
            const fullPath = path.join(dirPath, file);
            if (fs.statSync(fullPath).isDirectory()) {
                arrayOfFiles = this.getAllFiles(fullPath, arrayOfFiles);
            } else {
                // Ignore node_modules, .next, etc if they ever end up in src
                if (!fullPath.includes('node_modules')) {
                    arrayOfFiles.push(fullPath);
                }
            }
        });

        return arrayOfFiles;
    }

    public runScan(): { snapshot: FileSnapshot[], changes: string[] } {
        const allFiles = this.getAllFiles(this.rootDir);
        const currentSnapshot: FileSnapshot[] = allFiles.map(file => ({
            path: file,
            mtime: fs.statSync(file).mtimeMs
        }));

        let previousSnapshot: FileSnapshot[] = [];
        try {
            if (fs.existsSync(this.stateFilePath)) {
                const stateData = JSON.parse(fs.readFileSync(this.stateFilePath, 'utf-8'));
                previousSnapshot = stateData.files || [];
            }
        } catch (error) {
            console.error('Sentinel FileWatcher Error: No se pudo leer el estado anterior.', error);
        }

        const changes: string[] = [];

        // Compare current against previous
        currentSnapshot.forEach(currentFile => {
            const previousFile = previousSnapshot.find(p => p.path === currentFile.path);
            if (!previousFile) {
                changes.push(`[NUEVO] ${path.relative(this.rootDir, currentFile.path)}`);
            } else if (currentFile.mtime > previousFile.mtime) {
                changes.push(`[MODIFICADO] ${path.relative(this.rootDir, currentFile.path)}`);
            }
        });

        return { snapshot: currentSnapshot, changes };
    }

    public saveState(files: FileSnapshot[], logs: any[], dbStatus: any) {
        const state = {
            timestamp: new Date().toISOString(),
            files,
            logs,
            dbStatus
        };
        fs.writeFileSync(this.stateFilePath, JSON.stringify(state, null, 2), 'utf-8');
    }
}
