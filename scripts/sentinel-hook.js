const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(process.cwd(), 'src');
const stateFilePath = path.resolve(process.cwd(), 'src/core/sentinel/sentinel_state.json');

console.log('🛡️  Antigravity Sentinel Lifecycle Hook Iniciado');

function getAllFiles(dirPath, arrayOfFiles = []) {
    const files = fs.readdirSync(dirPath);
    files.forEach((file) => {
        const fullPath = path.join(dirPath, file);
        if (fs.statSync(fullPath).isDirectory()) {
            arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
        } else {
            if (!fullPath.includes('node_modules')) {
                arrayOfFiles.push(fullPath);
            }
        }
    });
    return arrayOfFiles;
}

try {
    // Check if the directory exists
    const sentinelDir = path.dirname(stateFilePath);
    if (!fs.existsSync(sentinelDir)) {
        fs.mkdirSync(sentinelDir, { recursive: true });
    }

    const allFiles = getAllFiles(rootDir);
    const snapshot = allFiles.map(file => ({
        path: file,
        mtime: fs.statSync(file).mtimeMs
    }));

    let state = {};
    if (fs.existsSync(stateFilePath)) {
        state = JSON.parse(fs.readFileSync(stateFilePath, 'utf-8'));
    }

    // Update only the files snapshot during the build phase
    state.files = snapshot;
    state.lastDeployment = new Date().toISOString();

    fs.writeFileSync(stateFilePath, JSON.stringify(state, null, 2), 'utf-8');
    console.log('✅ Sentinel Snapshot actualizado correctamente. Ready for deployment.');
} catch (error) {
    console.error('❌ Sentinel Hook Falló:', error.message);
    process.exit(1);
}
