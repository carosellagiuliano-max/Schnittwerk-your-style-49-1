export interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  service: string;
  action: string;
  message: string;
  data?: any;
  error?: Error;
  userId?: string;
  sessionId?: string;
}

class Logger {
  private static instance: Logger;
  private logs: LogEntry[] = [];
  private maxLogs = 1000;

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private createLogEntry(
    level: LogEntry['level'],
    service: string,
    action: string,
    message: string,
    data?: any,
    error?: Error,
    userId?: string,
    sessionId?: string
  ): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      service,
      action,
      message,
      data,
      error,
      userId,
      sessionId,
    };
  }

  private addLog(entry: LogEntry) {
    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Console output for development
    const logData = {
      ...entry,
      data: entry.data ? JSON.stringify(entry.data, null, 2) : undefined,
      error: entry.error?.stack || entry.error?.message,
    };
    
    switch (entry.level) {
      case 'error':
        console.error(`[${entry.service}] ${entry.action}: ${entry.message}`, logData);
        break;
      case 'warn':
        console.warn(`[${entry.service}] ${entry.action}: ${entry.message}`, logData);
        break;
      case 'debug':
        console.debug(`[${entry.service}] ${entry.action}: ${entry.message}`, logData);
        break;
      default:
        console.log(`[${entry.service}] ${entry.action}: ${entry.message}`, logData);
    }
  }

  info(service: string, action: string, message: string, data?: any, userId?: string, sessionId?: string) {
    const entry = this.createLogEntry('info', service, action, message, data, undefined, userId, sessionId);
    this.addLog(entry);
  }

  warn(service: string, action: string, message: string, data?: any, userId?: string, sessionId?: string) {
    const entry = this.createLogEntry('warn', service, action, message, data, undefined, userId, sessionId);
    this.addLog(entry);
  }

  error(service: string, action: string, message: string, error?: Error, data?: any, userId?: string, sessionId?: string) {
    const entry = this.createLogEntry('error', service, action, message, data, error, userId, sessionId);
    this.addLog(entry);
  }

  debug(service: string, action: string, message: string, data?: any, userId?: string, sessionId?: string) {
    const entry = this.createLogEntry('debug', service, action, message, data, undefined, userId, sessionId);
    this.addLog(entry);
  }

  getLogs(level?: LogEntry['level'], service?: string): LogEntry[] {
    let filteredLogs = this.logs;
    
    if (level) {
      filteredLogs = filteredLogs.filter(log => log.level === level);
    }
    
    if (service) {
      filteredLogs = filteredLogs.filter(log => log.service === service);
    }
    
    return filteredLogs;
  }

  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  clearLogs() {
    this.logs = [];
  }
}

export const logger = Logger.getInstance();

// Service-specific loggers
export const paymentLogger = {
  info: (action: string, message: string, data?: any, userId?: string, sessionId?: string) => 
    logger.info('PaymentService', action, message, data, userId, sessionId),
  warn: (action: string, message: string, data?: any, userId?: string, sessionId?: string) => 
    logger.warn('PaymentService', action, message, data, userId, sessionId),
  error: (action: string, message: string, error?: Error, data?: any, userId?: string, sessionId?: string) => 
    logger.error('PaymentService', action, message, error, data, userId, sessionId),
  debug: (action: string, message: string, data?: any, userId?: string, sessionId?: string) => 
    logger.debug('PaymentService', action, message, data, userId, sessionId),
};

export const orderLogger = {
  info: (action: string, message: string, data?: any, userId?: string, sessionId?: string) => 
    logger.info('OrderService', action, message, data, userId, sessionId),
  warn: (action: string, message: string, data?: any, userId?: string, sessionId?: string) => 
    logger.warn('OrderService', action, message, data, userId, sessionId),
  error: (action: string, message: string, error?: Error, data?: any, userId?: string, sessionId?: string) => 
    logger.error('OrderService', action, message, error, data, userId, sessionId),
  debug: (action: string, message: string, data?: any, userId?: string, sessionId?: string) => 
    logger.debug('OrderService', action, message, data, userId, sessionId),
};

export const invoiceLogger = {
  info: (action: string, message: string, data?: any, userId?: string, sessionId?: string) => 
    logger.info('InvoiceService', action, message, data, userId, sessionId),
  warn: (action: string, message: string, data?: any, userId?: string, sessionId?: string) => 
    logger.warn('InvoiceService', action, message, data, userId, sessionId),
  error: (action: string, message: string, error?: Error, data?: any, userId?: string, sessionId?: string) => 
    logger.error('InvoiceService', action, message, error, data, userId, sessionId),
  debug: (action: string, message: string, data?: any, userId?: string, sessionId?: string) => 
    logger.debug('InvoiceService', action, message, data, userId, sessionId),
};

export const voucherLogger = {
  info: (action: string, message: string, data?: any, userId?: string, sessionId?: string) => 
    logger.info('VoucherService', action, message, data, userId, sessionId),
  warn: (action: string, message: string, data?: any, userId?: string, sessionId?: string) => 
    logger.warn('VoucherService', action, message, data, userId, sessionId),
  error: (action: string, message: string, error?: Error, data?: any, userId?: string, sessionId?: string) => 
    logger.error('VoucherService', action, message, error, data, userId, sessionId),
  debug: (action: string, message: string, data?: any, userId?: string, sessionId?: string) => 
    logger.debug('VoucherService', action, message, data, userId, sessionId),
};