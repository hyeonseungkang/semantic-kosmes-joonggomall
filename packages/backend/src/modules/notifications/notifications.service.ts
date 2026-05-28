import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as webpush from 'web-push';

export interface NotifyPayload {
  userId: string;
  pushToken?: string;
  phone?: string;
  channel: 'push' | 'kakao' | 'email';
  title: string;
  body: string;
  url?: string;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private readonly config: ConfigService) {
    const vapidPublic = config.get<string>('VAPID_PUBLIC_KEY');
    const vapidPrivate = config.get<string>('VAPID_PRIVATE_KEY');
    const vapidSubject = config.get<string>('VAPID_SUBJECT', 'mailto:admin@example.com');
    if (vapidPublic && vapidPrivate) {
      webpush.setVapidDetails(vapidSubject, vapidPublic, vapidPrivate);
    }
  }

  async send(payload: NotifyPayload) {
    switch (payload.channel) {
      case 'push':
        return this.sendWebPush(payload);
      case 'kakao':
        return this.sendKakaoAlimtalk(payload);
      default:
        this.logger.warn(`Unsupported channel: ${payload.channel}`);
    }
  }

  private async sendWebPush(payload: NotifyPayload) {
    if (!payload.pushToken) return;
    try {
      const subscription = JSON.parse(payload.pushToken);
      await webpush.sendNotification(
        subscription,
        JSON.stringify({ title: payload.title, body: payload.body, url: payload.url }),
      );
    } catch (e) {
      this.logger.error(`Web push failed: ${(e as Error).message}`);
    }
  }

  private async sendKakaoAlimtalk(payload: NotifyPayload) {
    const apiKey = this.config.get<string>('KAKAO_ALERT_REST_API_KEY');
    const senderKey = this.config.get<string>('KAKAO_ALERT_SENDER_KEY');
    const templateId = this.config.get<string>('KAKAO_ALERT_TEMPLATE_ID');
    if (!apiKey || !senderKey || !templateId || !payload.phone) return;

    try {
      await axios.post(
        'https://alimtalk-api.kakao.com/v2/sender/send',
        {
          senderKey,
          templateCode: templateId,
          recipientList: [
            {
              recipientNo: payload.phone,
              templateParameter: { title: payload.title, body: payload.body },
            },
          ],
        },
        { headers: { 'X-Secret-Key': apiKey } },
      );
    } catch (e) {
      this.logger.error(`Kakao alimtalk failed: ${(e as Error).message}`);
    }
  }
}
