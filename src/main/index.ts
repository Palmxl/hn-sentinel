import { app, BrowserWindow, shell } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import log from 'electron-log'
import { initDatabase } from './database/connection'
import { registerAllIpcHandlers, setSchedulerRef } from './ipc/registry'
import { ScraperScheduler } from './scheduler/scraperScheduler'

log.transports.file.level = 'info'
log.transports.console.level = is.dev ? 'debug' : 'warn'
log.info('HN Sentinel iniciando...')

let mainWindow: BrowserWindow | null = null

function createWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux'
      ? { icon: join(__dirname, '../../resources/icon.png') }
      : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    },
    backgroundColor: '#0d0f14'
  })

  // Muestra la ventana solo cuando está lista para evitar flash blanco
  win.on('ready-to-show', () => {
    win.show()
  })

  // Abre links externos en el navegador del sistema
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    win.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'))
  }

  return win
}

app.whenReady().then(async () => {
  electronApp.setAppUserModelId('com.hnsentinel')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // 1. Inicializar base de datos
  try {
    initDatabase()
    log.info('Base de datos inicializada')
  } catch (err) {
    log.error('Error inicializando base de datos:', err)
    app.quit()
    return
  }

  // 2. Registrar handlers de IPC
  registerAllIpcHandlers()
  log.info('Handlers IPC registrados')

  // 3. Crear ventana principal
  mainWindow = createWindow()

  // 4. Iniciar scheduler (necesita la ventana para enviar eventos al renderer)
  const scheduler = new ScraperScheduler(mainWindow)
  setSchedulerRef(scheduler)
  await scheduler.start()
  log.info('Scheduler iniciado')

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      mainWindow = createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  log.info('HN Sentinel cerrando')
  if (process.platform !== 'darwin') {
    app.quit()
  }
})