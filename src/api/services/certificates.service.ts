import { apiRequest, toQueryString } from '../client';

export type CreateCertificateTemplatePayload = {
  certificateType: string;
  templateName: string;
  logoUrl?: string;
  signatureUrl?: string;
  backgroundUrl?: string;
  description?: string;
  status?: 'Active' | 'Inactive';
  lastUpdatedBy?: string;
};

export type CreateCertificatePayload = {
  templateId: string;
  recipientId: string;
  title: string;
  recipientType?: 'MITRA' | 'USER';
  recipientName?: string;
  recipientMobile?: string;
  description?: string;
  eventName?: string;
  issueDate?: string;
  issuedBy?: string;
  treesPlanted?: number;
  status?: 'ISSUED' | 'REVOKED';
};

export const certificatesService = {
  createTemplate(payload: CreateCertificateTemplatePayload) {
    return apiRequest('/certificates/templates', {
      method: 'POST',
      body: payload,
    });
  },

  listTemplates(search?: string) {
    return apiRequest(
      `/certificates/templates${toQueryString({ search })}`,
    );
  },

  getTemplate(id: string) {
    return apiRequest(`/certificates/templates/${id}`);
  },

  updateTemplate(
    id: string,
    payload: Partial<CreateCertificateTemplatePayload>,
  ) {
    return apiRequest(`/certificates/templates/${id}`, {
      method: 'PATCH',
      body: payload,
    });
  },

  removeTemplate(id: string) {
    return apiRequest(`/certificates/templates/${id}`, { method: 'DELETE' });
  },

  verify(code: string) {
    return apiRequest(`/certificates/verify/${encodeURIComponent(code)}`, {
      auth: false,
    });
  },

  listByMitra(mitraId: string) {
    return apiRequest(`/certificates/mitra/${encodeURIComponent(mitraId)}`);
  },

  listMine() {
    return apiRequest('/certificates/me');
  },

  issue(payload: CreateCertificatePayload) {
    return apiRequest('/certificates', { method: 'POST', body: payload });
  },

  list(params: {
    status?: string;
    recipientType?: string;
    search?: string;
  } = {}) {
    return apiRequest(`/certificates${toQueryString(params)}`);
  },

  getById(id: string) {
    return apiRequest(`/certificates/${id}`);
  },

  shareWhatsapp(id: string) {
    return apiRequest(`/certificates/${id}/share-whatsapp`, {
      method: 'POST',
    });
  },

  revoke(id: string) {
    return apiRequest(`/certificates/${id}/revoke`, { method: 'PATCH' });
  },

  update(id: string, payload: Partial<CreateCertificatePayload>) {
    return apiRequest(`/certificates/${id}`, {
      method: 'PATCH',
      body: payload,
    });
  },

  remove(id: string) {
    return apiRequest(`/certificates/${id}`, { method: 'DELETE' });
  },
};
