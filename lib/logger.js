const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class Logger {
  constructor(options = {}) {
    this.serviceName = options.serviceName || 'staticghost-main';
    this.logFilePath = options.logFilePath || null;
  }

  generateRequestId() {
    return 'req_' + crypto.randomBytes(8).toString('hex');
  }

  formatLog(level, message, fields = {}) {
    const entry = {
      timestamp: new Date().toISOString(),
      service: this.serviceName,
      level: level.toUpperCase(),
      message: message,
      requestId: fields.requestId || fields.RequestId || null,
      durationMs: fields.durationMs !== undefined ? fields.durationMs : (fields.DurationMs !== undefined ? fields.DurationMs : (fields.Duration !== undefined ? fields.Duration : null)),
      endpoint: fields.endpoint || fields.Endpoint || null,
      customerId: fields.customerId || fields.CustomerId || null,
      exception: fields.exception || fields.Exception ? (fields.exception?.stack || fields.exception?.message || String(fields.exception)) : null,
      metadata: { ...fields }
    };

    // Clean nulls from metadata
    delete entry.metadata.requestId;
    delete entry.metadata.RequestId;
    delete entry.metadata.durationMs;
    delete entry.metadata.DurationMs;
    delete entry.metadata.Duration;
    delete entry.metadata.endpoint;
    delete entry.metadata.Endpoint;
    delete entry.metadata.customerId;
    delete entry.metadata.CustomerId;
    delete entry.metadata.exception;
    delete entry.metadata.Exception;

    return JSON.stringify(entry);
  }

  log(level, message, fields = {}) {
    const jsonOutput = this.formatLog(level, message, fields);
    
    // Write to stderr/stdout as structured JSON
    if (level === 'error') {
      console.error(jsonOutput);
    } else {
      console.log(jsonOutput);
    }

    // Write to persistent log file if path is specified
    if (this.logFilePath) {
      try {
        const dir = path.dirname(this.logFilePath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        fs.appendFileSync(this.logFilePath, jsonOutput + '\n', 'utf8');
      } catch (e) {
        // Fallback gracefully
      }
    }
  }

  info(message, fields = {}) {
    this.log('info', message, fields);
  }

  warn(message, fields = {}) {
    this.log('warn', message, fields);
  }

  error(message, fields = {}) {
    this.log('error', message, fields);
  }

  debug(message, fields = {}) {
    this.log('debug', message, fields);
  }

  startSpan(spanName, fields = {}) {
    const startTime = Date.now();
    const spanId = 'span_' + crypto.randomBytes(6).toString('hex');
    const requestId = fields.requestId || this.generateRequestId();

    this.info(`[Span Start] ${spanName}`, { ...fields, requestId, spanId, event: 'span_start' });

    return {
      spanId,
      requestId,
      end: (endFields = {}) => {
        const durationMs = Date.now() - startTime;
        this.info(`[Span End] ${spanName}`, {
          ...fields,
          ...endFields,
          requestId,
          spanId,
          durationMs,
          event: 'span_end'
        });
        return durationMs;
      }
    };
  }
}

module.exports = Logger;
