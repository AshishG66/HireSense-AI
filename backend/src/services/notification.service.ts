import { Request, Response } from 'express';
import logger from '../lib/logger';
import prisma from '../lib/prisma';

export interface SseClient {
  userId: string;
  res: Response;
}

export class NotificationService {
  private clients: SseClient[] = [];

  addClient(userId: string, req: Request, res: Response) {
    logger.info(`SSE: Client connected for user ${userId}`);
    
    // Set headers for SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');

    this.clients.push({ userId, res });

    // Send handshake
    res.write(`data: ${JSON.stringify({ type: 'HANDSHAKE', status: 'connected' })}\n\n`);

    req.on('close', () => {
      this.removeClient(userId, res);
    });
  }

  removeClient(userId: string, res: Response) {
    logger.info(`SSE: Client disconnected for user ${userId}`);
    this.clients = this.clients.filter((client) => !(client.userId === userId && client.res === res));
  }

  async sendNotification(userId: string, event: { type: string; payload: any }) {
    logger.info(`Broadcasting SSE notification to user ${userId} of type ${event.type}`);

    // Persist notification in database for persistence history
    try {
      await prisma.notification.create({
        data: {
          userId,
          title: this.getNotificationTitle(event.type),
          message: event.payload.message || `Resume analysis completed.`,
          type: 'ALERT',
        },
      });
    } catch (err: any) {
      logger.error(`Failed to save notification record to DB: ${err.message}`);
    }

    const userClients = this.clients.filter((client) => client.userId === userId);
    for (const client of userClients) {
      try {
        client.res.write(`data: ${JSON.stringify(event)}\n\n`);
      } catch (err: any) {
        logger.error(`Failed to write SSE payload to client: ${err.message}`);
        this.removeClient(client.userId, client.res);
      }
    }
  }

  private getNotificationTitle(type: string): string {
    switch (type) {
      case 'ANALYSIS_COMPLETE':
        return 'Resume Analysis Complete';
      case 'ANALYSIS_FAILED':
        return 'Resume Analysis Failed';
      case 'ANALYSIS_PROCESSING':
        return 'Resume Analysis In Progress';
      default:
        return 'System Notification';
    }
  }
}

export const notificationService = new NotificationService();
export default notificationService;
