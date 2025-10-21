/**
 * Winston logger configuration
 * Supports multiple transports: console and file logging
 */

import winston from 'winston';
import * as path from 'path';
import * as fs from 'fs';

// Create logs directory if it doesn't exist
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Custom format for console output
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let metaStr = '';
    if (Object.keys(meta).length > 0) {
      metaStr = ` ${JSON.stringify(meta)}`;
    }
    return `${timestamp} ${level}: ${message}${metaStr}`;
  })
);

// Custom format for file output
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Create Winston logger instance
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  transports: [
    // Console transport - for user-facing output
    new winston.transports.Console({
      format: consoleFormat,
      level: 'info',
    }),
    
    // File transport - combined log (all levels)
    new winston.transports.File({
      filename: path.join(logsDir, 'badge-gen.log'),
      format: fileFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    
    // File transport - error log (errors only)
    new winston.transports.File({
      filename: path.join(logsDir, 'badge-gen-error.log'),
      format: fileFormat,
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
});

/**
 * Create a child logger with additional context
 */
export function createLogger(context: string) {
  return logger.child({ context });
}

/**
 * Log levels:
 * - error: Error messages
 * - warn: Warning messages
 * - info: Informational messages (default)
 * - http: HTTP request logging
 * - verbose: Verbose logging
 * - debug: Debug messages
 * - silly: Very detailed logging
 */
