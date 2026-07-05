import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

type EmbedResponse =
  | { mode: 'metabase'; embedUrl: string; provider: 'metabase' }
  | { mode: 'iframe'; embedUrl: string; provider?: 'powerbi' }
  | { mode: 'link'; shareUrl: string; provider?: 'metabase' | 'powerbi' }
  | {
      mode: 'embed';
      reportId: string;
      embedUrl: string;
      accessToken: string;
      expiration: string;
      provider?: 'powerbi';
    }
  | { mode: 'none'; message: string; setup: string[]; provider?: 'none' };

@Injectable()
export class PowerBiService {
  constructor(private config: ConfigService) {}

  private metabaseDashboardUrl() {
    return this.config.get<string>('METABASE_DASHBOARD_URL')?.trim() || '';
  }

  private metabasePublicUrl() {
    return this.config.get<string>('METABASE_PUBLIC_URL')?.trim() || '';
  }

  getStatus() {
    const mbDashboard = this.metabaseDashboardUrl();
    const mbPublic = this.metabasePublicUrl();
    if (mbDashboard || mbPublic) {
      return {
        configured: true,
        provider: 'metabase' as const,
        mode: mbDashboard ? 'metabase' : 'link',
        shareUrl: mbPublic || mbDashboard || null,
        reportId: null,
        workspaceId: null,
      };
    }

    const embedUrl = this.config.get<string>('POWERBI_EMBED_URL')?.trim();
    const shareUrl = this.config.get<string>('POWERBI_SHARE_URL')?.trim();
    const reportId = this.config.get<string>('POWER_BI_REPORT_ID')?.trim();
    const workspaceId = this.config.get<string>('POWER_BI_WORKSPACE_ID')?.trim();
    const hasSp = this.hasServicePrincipal();

    return {
      configured: Boolean(embedUrl || shareUrl || (hasSp && reportId && workspaceId)),
      provider: embedUrl || shareUrl || (hasSp && reportId && workspaceId) ? 'powerbi' as const : 'none' as const,
      mode: embedUrl ? 'iframe' : shareUrl ? 'link' : hasSp && reportId && workspaceId ? 'embed' : 'none',
      shareUrl: shareUrl ?? null,
      reportId: reportId ?? null,
      workspaceId: workspaceId ?? null,
    };
  }

  private hasServicePrincipal() {
    return Boolean(
      this.config.get('POWER_BI_CLIENT_ID')?.trim() &&
        this.config.get('POWER_BI_CLIENT_SECRET')?.trim() &&
        this.config.get('POWER_BI_TENANT_ID')?.trim(),
    );
  }

  async getEmbedConfig(): Promise<EmbedResponse> {
    const mbDashboard = this.metabaseDashboardUrl();
    if (mbDashboard) return { mode: 'metabase', embedUrl: mbDashboard, provider: 'metabase' };

    const mbPublic = this.metabasePublicUrl();
    if (mbPublic) return { mode: 'link', shareUrl: mbPublic, provider: 'metabase' };

    const embedUrl = this.config.get<string>('POWERBI_EMBED_URL')?.trim();
    if (embedUrl) return { mode: 'iframe', embedUrl, provider: 'powerbi' };

    const shareUrl = this.config.get<string>('POWERBI_SHARE_URL')?.trim();
    if (shareUrl) return { mode: 'link', shareUrl, provider: 'powerbi' };

    const workspaceId = this.config.get<string>('POWER_BI_WORKSPACE_ID')?.trim();
    const reportId = this.config.get<string>('POWER_BI_REPORT_ID')?.trim();

    if (!this.hasServicePrincipal() || !workspaceId || !reportId) {
      return {
        mode: 'none',
        provider: 'none',
        message: 'Metabase / Power BI belum dikonfigurasi',
        setup: [
          'Metabase: set METABASE_DASHBOARD_URL di .env',
          'Power BI: set POWERBI_SHARE_URL atau POWERBI_EMBED_URL',
        ],
      };
    }

    const aadToken = await this.getAzureToken();
    const reportRes = await fetch(
      `https://api.powerbi.com/v1.0/myorg/groups/${workspaceId}/reports/${reportId}`,
      { headers: { Authorization: `Bearer ${aadToken}` } },
    );

    if (!reportRes.ok) {
      const err = await reportRes.text();
      return { mode: 'none', message: `Gagal ambil report: ${err}`, setup: [] };
    }

    const report = await reportRes.json();
    const tokenRes = await fetch(
      `https://api.powerbi.com/v1.0/myorg/groups/${workspaceId}/reports/${reportId}/GenerateToken`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${aadToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ accessLevel: 'View', allowSaveAs: false }),
      },
    );

    if (!tokenRes.ok) {
      const err = await tokenRes.text();
      return { mode: 'none', message: `Gagal generate token: ${err}`, setup: [] };
    }

    const tokenData = await tokenRes.json();
    return {
      mode: 'embed',
      provider: 'powerbi',
      reportId: report.id,
      embedUrl: report.embedUrl,
      accessToken: tokenData.token,
      expiration: tokenData.expiration,
    };
  }

  private async getAzureToken(): Promise<string> {
    const tenantId = this.config.get<string>('POWER_BI_TENANT_ID')!;
    const clientId = this.config.get<string>('POWER_BI_CLIENT_ID')!;
    const clientSecret = this.config.get<string>('POWER_BI_CLIENT_SECRET')!;

    const res = await fetch(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret,
        scope: 'https://analysis.windows.net/powerbi/api/.default',
      }),
    });

    const data = await res.json();
    if (!data.access_token) throw new Error(data.error_description ?? 'Azure token gagal');
    return data.access_token;
  }
}
