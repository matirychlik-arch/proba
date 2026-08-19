'use strict'

/**
 * Proba — natywna aplikacja na macOS.
 *
 * Electron uruchamia lokalny serwer Next.js (tryb CLI = analizy na subskrypcji
 * Claude, bez kosztów API) i pokazuje go w natywnym oknie. Główna przewaga nad
 * wersją przeglądarkową: natywne okno wyboru pliku zwraca PRAWDZIWĄ ścieżkę do
 * wideo, więc ffmpeg czyta plik prosto z dysku — bez uploadu i bez limitu rozmiaru.
 */

const { app, BrowserWindow, dialog, ipcMain, shell, Menu } = require('electron')
const { spawn } = require('child_process')
const path = require('path')
const http = require('http')

const PORT = Number(process.env.PROBA_PORT || 3789)
const URL = `http://localhost:${PORT}`
const ROOT = path.join(__dirname, '..')

let mainWindow = null
let serverProcess = null

function waitForServer(timeoutMs = 90_000) {
  const started = Date.now()
  return new Promise((resolve, reject) => {
    const tick = () => {
      http
        .get(`${URL}/api/provider`, (res) => {
          res.resume()
          resolve()
        })
        .on('error', () => {
          if (Date.now() - started > timeoutMs) {
            reject(new Error('Serwer Proby nie wstał w wyznaczonym czasie'))
          } else {
            setTimeout(tick, 400)
          }
        })
    }
    tick()
  })
}

function startServer() {
  // Serwer dziedziczy PATH z powłoki logowania (Homebrew, nvm, ffmpeg, claude).
  serverProcess = spawn(
    process.execPath,
    [path.join(ROOT, 'node_modules', 'next', 'dist', 'bin', 'next'), 'start', '-p', String(PORT)],
    {
      cwd: ROOT,
      env: {
        ...process.env,
        CLAUDE_PROVIDER: process.env.CLAUDE_PROVIDER || 'cli',
        NODE_ENV: 'production',
        // Electron ustawia ELECTRON_RUN_AS_NODE, żeby uruchomić czysty Node.
        ELECTRON_RUN_AS_NODE: '1',
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    }
  )

  serverProcess.stdout.on('data', (d) => process.stdout.write(`[proba] ${d}`))
  serverProcess.stderr.on('data', (d) => process.stderr.write(`[proba] ${d}`))
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 960,
    minWidth: 1024,
    minHeight: 700,
    title: 'Proba',
    // Kremowe tło Proby, żeby start nie mignął bielą.
    backgroundColor: '#F0EDE6',
    titleBarStyle: 'hiddenInset',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    show: false,
  })

  mainWindow.once('ready-to-show', () => mainWindow.show())

  // Linki zewnętrzne otwieramy w przeglądarce, nie w oknie apki.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  mainWindow.on('closed', () => (mainWindow = null))
  return mainWindow
}

function showFatal(message) {
  dialog.showErrorBox('Proba', message)
  app.quit()
}

// ── IPC: natywne okno wyboru wideo ──
ipcMain.handle('proba:pickVideo', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Wybierz wideo do analizy',
    properties: ['openFile'],
    filters: [
      { name: 'Wideo', extensions: ['mp4', 'mov', 'm4v', 'webm', 'mkv', 'avi'] },
      { name: 'Wszystkie pliki', extensions: ['*'] },
    ],
  })
  if (result.canceled || !result.filePaths.length) return null
  return result.filePaths[0]
})

/** Informuje UI, że działa w natywnej apce (a nie w przeglądarce). */
ipcMain.handle('proba:isDesktop', () => true)

app.whenReady().then(async () => {
  // Standardowe menu macOS — bez niego brakuje Cmd+C/V i Cmd+Q.
  Menu.setApplicationMenu(Menu.buildFromTemplate([
    { role: 'appMenu' },
    { role: 'editMenu' },
    { role: 'viewMenu' },
    { role: 'windowMenu' },
  ]))

  createWindow()
  mainWindow.loadURL(`data:text/html,${encodeURIComponent(
    `<body style="background:#F0EDE6;font-family:-apple-system,sans-serif;display:flex;
      align-items:center;justify-content:center;height:100vh;margin:0;color:#6B6860">
      <p>Uruchamiam Probę…</p></body>`
  )}`)

  try {
    startServer()
    await waitForServer()
    await mainWindow.loadURL(`${URL}/dashboard`)
  } catch (e) {
    showFatal(`Nie udało się uruchomić Proby.\n\n${e.message}`)
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
      mainWindow.loadURL(`${URL}/dashboard`)
    }
  })
})

function stopServer() {
  if (serverProcess && !serverProcess.killed) {
    serverProcess.kill('SIGTERM')
    serverProcess = null
  }
}

app.on('window-all-closed', () => {
  stopServer()
  if (process.platform !== 'darwin') app.quit()
})

app.on('before-quit', stopServer)
process.on('exit', stopServer)
