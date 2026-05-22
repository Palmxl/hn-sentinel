import * as cron from 'node-cron'
import { BrowserWindow, Notification } from 'electron'
import { runScrapeOrchestration } from '../scraper/orchestrator'
import { getSettings, updateSettings } from '../services/settingsService'
import { getSchedulerStatus } from '../services/scraperRunsService'
import { logger } from '../services/logsService'
import { IPC_CHANNELS } from '../../shared/types'

const CONTEXT = 'scheduler'

export class ScraperScheduler {
  private task: cron.ScheduledTask | null = null
  private isScrapingNow = false
  private nextRunAt: Date | null = null
  private window: BrowserWindow

  constructor(window: BrowserWindow) {
    this.window = window
  }

  async start(): Promise<void> {
    const settings = getSettings()

    if (!settings.isSchedulerEnabled) {
      logger.info('Scheduler desactivado en configuración', CONTEXT)
      return
    }

    this.scheduleWithInterval(settings.intervalMinutes)
    logger.info(
      `Scheduler iniciado con intervalo de ${settings.intervalMinutes} minutos`,
      CONTEXT
    )
  }

  private scheduleWithInterval(intervalMinutes: number): void {
    // Detiene la tarea anterior si existe
    this.task?.stop()

    const cronExpression = this.buildCronExpression(intervalMinutes)

    this.task = cron.schedule(cronExpression, async () => {
      await this.runScrape()
    })

    this.updateNextRunTime(intervalMinutes)
    this.emitStatus()
  }

  // Convierte minutos a expresión cron válida
  private buildCronExpression(intervalMinutes: number): string {
    if (intervalMinutes < 60) {
      return `*/${intervalMinutes} * * * *`
    }
    const hours = Math.floor(intervalMinutes / 60)
    return `0 */${hours} * * *`
  }

  private updateNextRunTime(intervalMinutes: number): void {
    const next = new Date()
    next.setMinutes(next.getMinutes() + intervalMinutes)
    this.nextRunAt = next
  }

  // Disparo manual desde la UI
  async runNow(): Promise<void> {
    if (this.isScrapingNow) {
      logger.warn('Ya hay un scrape en progreso, ignorando disparo manual', CONTEXT)
      return
    }
    await this.runScrape()
  }

  private async runScrape(): Promise<void> {
    if (this.isScrapingNow) return

    this.isScrapingNow = true
    this.emitStatus()

    try {
      logger.info('Ejecutando scrape programado', CONTEXT)
      const result = await runScrapeOrchestration()

      // Notifica al renderer que terminó el scrape
      this.emitToRenderer(IPC_CHANNELS.EVENT_SCRAPE_COMPLETE, result)

      // Si hubo posts nuevos, notifica con evento IPC y notificación del sistema
      if (result.postsInserted > 0) {
        this.emitToRenderer(IPC_CHANNELS.EVENT_NEW_POSTS, {
          count: result.postsInserted
        })
        this.showNotification(result.postsInserted)
      }
    } catch (err) {
      logger.error(`Error en scrape del scheduler: ${err}`, CONTEXT)
    } finally {
      this.isScrapingNow = false
      const settings = getSettings()
      this.updateNextRunTime(settings.intervalMinutes)
      this.emitStatus()
    }
  }

  // Muestra notificación nativa del sistema operativo
  private showNotification(count: number): void {
    try {
      if (Notification.isSupported()) {
        new Notification({
          title: 'HN Sentinel',
          body: `${count} nuevo${count > 1 ? 's' : ''} post${count > 1 ? 's' : ''} detectado${count > 1 ? 's' : ''}`,
          urgency: 'normal'
        }).show()
        logger.info(`Notificación enviada: ${count} posts nuevos`, CONTEXT)
      }
    } catch (err) {
      logger.warn(`No se pudo mostrar notificación: ${err}`, CONTEXT)
    }
  }

  // Envía el estado actual del scheduler al renderer
  private emitStatus(): void {
    const status = getSchedulerStatus(
      this.isScrapingNow,
      this.nextRunAt?.toISOString() ?? null
    )
    this.emitToRenderer(IPC_CHANNELS.EVENT_SCHEDULER_STATUS, status)
  }

  // Envía un evento al renderer de forma segura
  private emitToRenderer(channel: string, data: unknown): void {
    if (this.window && !this.window.isDestroyed()) {
      this.window.webContents.send(channel, data)
    }
  }

  updateInterval(intervalMinutes: number): void {
    updateSettings({ intervalMinutes })
    const settings = getSettings()
    if (settings.isSchedulerEnabled) {
      this.scheduleWithInterval(intervalMinutes)
      logger.info(
        `Intervalo del scheduler actualizado a ${intervalMinutes} minutos`,
        CONTEXT
      )
    }
  }

  toggle(enabled: boolean): void {
    updateSettings({ isSchedulerEnabled: enabled })
    if (enabled) {
      const settings = getSettings()
      this.scheduleWithInterval(settings.intervalMinutes)
      logger.info('Scheduler activado', CONTEXT)
    } else {
      this.task?.stop()
      this.task = null
      logger.info('Scheduler desactivado', CONTEXT)
    }
    this.emitStatus()
  }

  getStatus(): ReturnType<typeof getSchedulerStatus> {
    return getSchedulerStatus(
      this.isScrapingNow,
      this.nextRunAt?.toISOString() ?? null
    )
  }

  stop(): void {
    this.task?.stop()
    this.task = null
    logger.info('Scheduler detenido', CONTEXT)
  }
}