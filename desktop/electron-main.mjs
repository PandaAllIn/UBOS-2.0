import { app, BrowserWindow, Tray, Menu, nativeImage } from 'electron';
import { spawn } from 'child_process';
import path from 'path';
import url from 'url';

const DASHBOARD_PORT = process.env.DASHBOARD_PORT || '3000';
let mainWindow = null;
let tray = null;
let serverProcess = null;

import http from 'http';
async function wait(ms) { return new Promise(r => setTimeout(r, ms)); }
async function pingHealth(maxTries = 50) {
  return new Promise(async (resolve) => {
    let tries = 0;
    const check = () => {
      tries++;
      const req = http.request({ hostname: 'localhost', port: Number(DASHBOARD_PORT), path: '/api/health', method: 'GET' }, (res) => {
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
          resolve(true);
        } else if (tries >= maxTries) {
          resolve(false);
        } else {
          setTimeout(check, 200);
        }
      });
      req.on('error', () => {
        if (tries >= maxTries) resolve(false); else setTimeout(check, 200);
      });
      req.end();
    };
    check();
  });
}

function startDashboardServer() {
  // Spawn the Typescript dashboard server with tsx
  const cmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';
  serverProcess = spawn(cmd, ['-y', 'tsx', 'src/dashboard/dashboardServer.ts'], {
    cwd: process.cwd(),
    env: { ...process.env, DASHBOARD_PORT },
    stdio: 'inherit'
  });
  serverProcess.on('exit', (code) => {
    console.log(`[electron] dashboard server exited with code ${code}`);
  });
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    title: 'UBOS • Mission Control Dashboard',
    webPreferences: { contextIsolation: true }
  });
  const target = `http://localhost:${DASHBOARD_PORT}`;
  await mainWindow.loadURL(target);
}

function createTray() {
  try {
    tray = new Tray(nativeImage.createEmpty());
  } catch {
    // Fallback without icon
    tray = new Tray(nativeImage.createEmpty());
  }
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Open Dashboard', click: () => { if (mainWindow) { mainWindow.show(); mainWindow.focus(); } } },
    { label: 'Reload', click: () => { if (mainWindow) mainWindow.reload(); } },
    { type: 'separator' },
    { label: 'Quit', click: () => { app.quit(); } }
  ]);
  tray.setToolTip('UBOS • Mission Control');
  tray.setContextMenu(contextMenu);
  tray.on('click', () => { if (mainWindow) mainWindow.show(); });
}

// Disable GPU for compatibility on older macOS versions / headless
app.commandLine.appendSwitch('disable-gpu');
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.disableHardwareAcceleration();

app.whenReady().then(async () => {
  startDashboardServer();
  const ok = await pingHealth(100);
  if (!ok) {
    console.error('[electron] dashboard server did not respond on time');
  }
  await createWindow();
  createTray();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  // Keep running in tray on macOS
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  try { if (serverProcess) serverProcess.kill('SIGTERM'); } catch {}
});
