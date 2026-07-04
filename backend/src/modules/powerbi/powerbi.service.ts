import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

type EmbedResponse =
  | { mode: 'iframe'; embedUrl: string }
  | { mode: 'link'; shareUrl: string }
  | {
      mode: 'embed';
      reportId: string;
      embedUrl: string;
      accessToken: string;
      expiration: string;
    }
  | { mode: 'none'; message: string; setup: string[] };

@Injectable()
export class PowerBiService {
  constructor(private config: ConfigService) {}

  getStatus() {
    const embedUrl = this.config.get<string>('POWERBI_EMBED_URL')?.trim();
    const shareUrl = this.config.get<string>('POWERBI_SHARE_URL')?.trim();
    const reportId = this.config.get<string>('POWER_BI_REPORT_ID')?.trim();
    const workspaceId = this.config.get<string>('POWER_BI_WORKSPACE_ID')?.trim();
    const hasSp = this.hasServicePrincipal();

    return {
      configured: Boolean(embedUrl || shareUrl || (hasSp && reportId && workspaceId)),
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
    const embedUrl = this.config.get<string>('POWERBI_EMBED_URL')?.trim();
    if (embedUrl) return { mode: 'iframe', embedUrl };

    const shareUrl = this.config.get<string>('POWERBI_SHARE_URL')?.trim();
    if (shareUrl) return { mode: 'link', shareUrl };

    const workspaceId = this.config.get<string>('POWER_BI_WORKSPACE_ID')?.trim();
    const reportId = this.config.get<string>('POWER_BI_REPORT_ID')?.trim();

    if (!this.hasServicePrincipal() || !workspaceId || !reportId) {
      return {
        mode: 'none',
        message: 'Power BI belum dikonfigurasi',
        setup: [
          'Opsi B: set POWERBI_SHARE_URL di .env (Share → Copy link dari Power BI)',
          'Opsi A: set POWERBI_EMBED_URL (Publish to Web, butuh admin enable)',
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
