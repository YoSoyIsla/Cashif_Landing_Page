const fs = require('fs');
const path = require('path');

const ROOT_DIR = __dirname;
const DIST_DIR = path.join(ROOT_DIR, 'dist');

// Helper to copy directory recursively
function copyDirSync(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Single file sync to dist
function syncFile(relativePath) {
  const src = path.join(ROOT_DIR, relativePath);
  const dest = path.join(DIST_DIR, relativePath);

  if (!fs.existsSync(src)) return false;

  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    copyDirSync(src, dest);
    return true;
  }

  const destDir = path.dirname(dest);
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }

  fs.copyFileSync(src, dest);
  return true;
}

// Full build
function buildAll(silent = false) {
  if (!silent) console.log('🚀 Building production distribution...');

  if (fs.existsSync(DIST_DIR)) {
    fs.rmSync(DIST_DIR, { recursive: true, force: true });
  }
  fs.mkdirSync(DIST_DIR, { recursive: true });

  // 1. Copy root web files
  ['index.html', 'style.css', 'main.js'].forEach(file => {
    const src = path.join(ROOT_DIR, file);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, path.join(DIST_DIR, file));
    }
  });

  // 2. Copy assets
  const assetsSrc = path.join(ROOT_DIR, 'assets');
  if (fs.existsSync(assetsSrc)) {
    copyDirSync(assetsSrc, path.join(DIST_DIR, 'assets'));
  }

  if (!silent) {
    console.log('✅ Local build completed successfully in dist/');
  }
}

// Watch mode for instant builds
function watchBuild() {
  buildAll();
  console.log('👀 Watching files for instant build sync to dist/...');

  const filesToWatch = ['index.html', 'style.css', 'main.js'];
  filesToWatch.forEach(file => {
    const filePath = path.join(ROOT_DIR, file);
    if (fs.existsSync(filePath)) {
      fs.watch(filePath, (eventType) => {
        if (eventType === 'change') {
          syncFile(file);
          console.log(`⚡ [Instant Build] Synced ${file} to dist/`);
        }
      });
    }
  });

  const assetsDir = path.join(ROOT_DIR, 'assets');
  if (fs.existsSync(assetsDir)) {
    fs.watch(assetsDir, { recursive: true }, (eventType, filename) => {
      if (filename) {
        const rel = path.join('assets', filename);
        if (syncFile(rel)) {
          console.log(`⚡ [Instant Build] Synced ${rel} to dist/`);
        }
      }
    });
  }
}

// CLI execution
if (require.main === module) {
  if (process.argv.includes('--watch') || process.argv.includes('-w')) {
    watchBuild();
  } else {
    buildAll();
  }
}

module.exports = {
  buildAll,
  syncFile,
  watchBuild,
  DIST_DIR,
  ROOT_DIR
};
