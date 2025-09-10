import { app, BrowserWindow, Tray, Menu, nativeImage } from 'electron';
import { spawn } from 'child_process';
import path from 'path';
import url from 'url';

const DASHBOARD_PORT = process.env.DASHBOARD_PORT || '3000';
let mainWindow = null;
let tray = null;
let serverProcess = null;

async function wait(ms) { return new Promise(r => setTimeout(r, ms)); }

async function pingHealth(maxTries = 50) {
  const endpoint = `http://localhost:${DASHBOARD_PORT}/api/health`;
  for (let i = 0; i < maxTries; i++) {
    try {
      const res = await fetch(endpoint, { method: 'GET' });
      if (res.ok) return true;
    } catch {}
    await wait(200);
  }
  return false;
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

