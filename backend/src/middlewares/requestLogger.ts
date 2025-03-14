import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { OutgoingHttpHeaders } from 'http';

// Extend Express Request type to include our custom properties
declare global {
  namespace Express {
    interface Request {
      id?: string;
      startTime?: number;
    }
  }
}

function sanitizeHeaders(headers: any) {
  const sanitized = { ...headers };
  // Remove sensitive headers
  delete sanitized.authorization;
  delete sanitized.cookie;
  return sanitized;
}

function sanitizeBody(body: any) {
  if (!body) return {};
  const sanitized = { ...body };
  // Remove sensitive fields
  delete sanitized.password;
  delete sanitized.token;
  delete sanitized.creditCard;
  return sanitized;
}

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  // Generate unique request ID
  req.id = uuidv4();
  req.startTime = Date.now();

  // Create initial log entry
  const logContext = {
    id: req.id,
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url,
    path: req.path,
    query: req.query,
    params: req.params,
    body: sanitizeBody(req.body),
    headers: sanitizeHeaders(req.headers),
    ip: req.ip,
    userId: req.user?.id
  };

  console.log(`[REQUEST] [${req.id}]`, logContext);

  // Track response
  const oldEnd = res.end;
  const chunks: Buffer[] = [];

  // Capture response body
  const oldWrite = res.write;
  res.write = function(chunk: any) {
    chunks.push(Buffer.from(chunk));
    return oldWrite.apply(res, arguments as any);
  };

  res.end = function(chunk: any) {
    if (chunk) {
      chunks.push(Buffer.from(chunk));
    }

    const responseBody = Buffer.concat(chunks).toString('utf8');
    const duration = Date.now() - (req.startTime || Date.now());
    
    // Log response details
    const responseLog: {
      id: string | undefined;
      timestamp: string;
      duration: string;
      method: string;
      url: string;
      statusCode: number;
      statusMessage: string;
      contentLength: string | undefined;
      headers: OutgoingHttpHeaders;
      error?: any;
    } = {
      id: req.id,
      timestamp: new Date().toISOString(),
      duration: `${duration}ms`,
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      statusMessage: res.statusMessage,
      contentLength: res.get('content-length'),
      headers: res.getHeaders()
    };

    // Only log response body for non-200 responses and if it's not too large
    if (res.statusCode !== 200 && responseBody.length < 1024) {
      try {
        const parsedBody = JSON.parse(responseBody);
        if (parsedBody.error) {
          responseLog.error = parsedBody.error;
        }
      } catch (e) {
        // Response wasn't JSON, skip body parsing
      }
    }

    const logLevel = res.statusCode >= 500 ? 'error' : 
                    res.statusCode >= 400 ? 'warn' : 
                    'info';

    console[logLevel](`[RESPONSE] [${req.id}]`, responseLog);

    res.end = oldEnd;
    return oldEnd.apply(res, arguments as any);
  };

  next();
};