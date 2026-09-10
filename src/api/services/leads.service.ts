import { apiRequest } from '../client';

export type CreateLeadPayload = {
  name: string;
  mobile: string;
  email?: string;
  syncType?: string;
  message?: string;
  source?: string;
};

export type LeadResult = {
  success: boolean;
  message: string;
  crmSubmitted?: boolean;
};

export const leadsService = {
  async createLead(payload: CreateLeadPayload): Promise<LeadResult> {
    try {
      return await apiRequest<LeadResult>('/paryavaran/leads', {
        method: 'POST',
        body: payload,
      });
    } catch (err: any) {
      // If primary client API call fails due to device network/localhost issues, try live production endpoints
      if (err?.status === 0 || err?.message?.includes('Unable to reach the server')) {
        const candidateEndpoints = [
          'http://localhost:3000/api/v1/paryavaran/leads',
          'http://10.183.142.40:3000/api/v1/paryavaran/leads',
          'http://10.0.2.2:3000/api/v1/paryavaran/leads',
          'https://appadmin.paryavaranprahri.com/api/v1/paryavaran/leads',
        ];

        for (const url of candidateEndpoints) {
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);
            const response = await fetch(url, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
              },
              body: JSON.stringify(payload),
              signal: controller.signal,
            });
            clearTimeout(timeoutId);

            if (response.ok) {
              const parsed = await response.json();
              return (parsed?.data || parsed) as LeadResult;
            }
          } catch {
            // Try next fallback endpoint
          }
        }
      }
      throw err;
    }
  },
};
