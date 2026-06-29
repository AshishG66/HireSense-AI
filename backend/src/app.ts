import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import env from './config/env';
import logger from './lib/logger';
import requestIdMiddleware from './middlewares/requestId';
import rateLimiter from './middlewares/rateLimiter';
import errorHandler from './middlewares/errorHandler';
import v1Router from './routes/v1.routes';

const app = express();

// Inject Request ID tracer header
app.use(requestIdMiddleware);

// Set HTTP security headers
app.use(helmet());

// Enable Cross-Origin Resource Sharing
app.use(
  cors({
    origin: env.CORS_ORIGIN === '*' ? '*' : env.CORS_ORIGIN.split(','),
    credentials: true,
  }),
);

// Gzip compress response payloads
app.use(compression());

// Parse JSON request bodies and cookies
app.use(express.json());
app.use(cookieParser());

// Direct Morgan HTTP requests logging streams to Winston logger with RequestId tracing
app.use(
  morgan((tokens, req, res) => {
    const message = [
      tokens.method(req, res),
      tokens.url(req, res),
      tokens.status(req, res),
      tokens.res(req, res, 'content-length'),
      '-',
      tokens['response-time'](req, res),
      'ms',
    ].join(' ');
    logger.info(`[HTTP] ${message}`, { requestId: req.id });
    return null;
  }),
);

import monitoringService from './services/monitoring.service';

// Apply rate limiting to all API endpoints
app.use('/api', rateLimiter);

// Intercept request response speeds
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    monitoringService.recordRequest(res.statusCode, duration);
  });
  next();
});

import swaggerUi from 'swagger-ui-express';
const swaggerDocument = require('./config/swagger.json');

// Versioned APIs router groups
app.use('/api/v1', v1Router);

// Serve Swagger UI documentation
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Global fallback error catcher
app.use(errorHandler);

export default app;
