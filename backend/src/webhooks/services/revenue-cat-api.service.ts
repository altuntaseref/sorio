import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AxiosResponse } from 'axios';

@Injectable()
export class RevenueCatApiService {
  private readonly logger = new Logger(RevenueCatApiService.name);
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.revenuecat.com/v1';

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    this.apiKey = this.configService.get<string>('REVENUE_CAT_API_KEY') || '';
    if (!this.apiKey) {
      this.logger.warn('REVENUE_CAT_API_KEY not configured');
    }
  }

  /**
   * RevenueCat'ten kullanıcının güncel subscription bilgilerini getirir
   * @param appUserId Kullanıcının app_user_id'si (UUID)
   * @returns Subscription bilgileri
   */
  async getSubscriber(appUserId: string): Promise<any> {
    if (!this.apiKey) {
      throw new Error('REVENUE_CAT_API_KEY not configured');
    }

    try {
      const response: AxiosResponse = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/subscribers/${appUserId}`, {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }),
      );

      return response.data;
    } catch (error: any) {
      this.logger.error(
        `Failed to fetch subscriber from RevenueCat: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Kullanıcının aktif subscription'larını kontrol eder ve backend'i senkronize eder
   * @param appUserId Kullanıcının app_user_id'si (UUID)
   * @returns Senkronize edilmiş plan bilgisi
   */
  async syncSubscriber(appUserId: string): Promise<any> {
    const subscriber = await this.getSubscriber(appUserId);

    // Subscriber'dan aktif subscription'ı bul
    const entitlements = subscriber?.subscriber?.entitlements || {};
    const activeEntitlement = Object.values(entitlements).find(
      (ent: any) => ent.is_active === true,
    ) as any;

    if (!activeEntitlement) {
      this.logger.warn(`No active entitlement found for user ${appUserId}`);
      return null;
    }

    // Product ID'yi al
    const productId = activeEntitlement.product_identifier;
    const expiresDate = activeEntitlement.expires_date
      ? new Date(activeEntitlement.expires_date)
      : null;
    const purchaseDate = activeEntitlement.purchase_date
      ? new Date(activeEntitlement.purchase_date)
      : new Date();

    return {
      productId,
      purchaseDate,
      expiresDate,
      isActive: activeEntitlement.is_active,
      willRenew: activeEntitlement.will_renew,
    };
  }
}
