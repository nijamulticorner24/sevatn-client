const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000').replace(/\/+$/, '');

class ApiClient {
  private getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('ta_auth_token');
  }

  setAuth(token: string, user: any) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('ta_auth_token', token);
      localStorage.setItem('ta_user', JSON.stringify(user));
    }
  }

  getUser(): any {
    if (typeof window === 'undefined') return null;
    const str = localStorage.getItem('ta_user');
    return str ? JSON.parse(str) : null;
  }

  updateCachedUser(updates: any) {
    if (typeof window !== 'undefined') {
      const current = this.getUser() || {};
      const updated = { ...current, ...updates };
      localStorage.setItem('ta_user', JSON.stringify(updated));
      return updated;
    }
    return null;
  }

  setLocationCoordinates(lat: number, lon: number, accuracy?: number) {
    if (typeof window !== 'undefined') {
      if (accuracy !== undefined && accuracy !== null && accuracy > 2500) {
        sessionStorage.removeItem('stn_current_lat');
        sessionStorage.removeItem('stn_current_lon');
        sessionStorage.removeItem('stn_current_acc');
        return;
      }
      sessionStorage.setItem('stn_current_lat', String(lat));
      sessionStorage.setItem('stn_current_lon', String(lon));
      if (accuracy !== undefined && accuracy !== null) {
        sessionStorage.setItem('stn_current_acc', String(accuracy));
      } else {
        sessionStorage.removeItem('stn_current_acc');
      }
    }
  }

  getLocationCoordinates(): { latitude: number; longitude: number; accuracy?: number } | null {
    if (typeof window === 'undefined') return null;
    const lat = sessionStorage.getItem('stn_current_lat');
    const lon = sessionStorage.getItem('stn_current_lon');
    const acc = sessionStorage.getItem('stn_current_acc');
    if (lat && lon) {
      return {
        latitude: parseFloat(lat),
        longitude: parseFloat(lon),
        accuracy: acc ? parseFloat(acc) : undefined,
      };
    }
    return null;
  }

  logout() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('ta_auth_token');
      localStorage.removeItem('ta_user');
      sessionStorage.removeItem('stn_current_lat');
      sessionStorage.removeItem('stn_current_lon');
      sessionStorage.removeItem('stn_current_acc');
      window.location.href = '/auth/login';
    }
  }

  public async request(path: string, options: RequestInit = {}) {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Attach client coordinate headers if available for 5 KM Geofence validation
    const coords = this.getLocationCoordinates();
    if (coords) {
      headers['x-user-latitude'] = String(coords.latitude);
      headers['x-user-longitude'] = String(coords.longitude);
      if (coords.accuracy) headers['x-user-accuracy'] = String(coords.accuracy);
    }

    try {
      const res = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers,
      });

      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401 && typeof window !== 'undefined' && !path.startsWith('/auth/login')) {
          const errMsg = String(data.message || data.error || '');
          if (
            errMsg.includes('User not found') ||
            errMsg.includes('token invalid') ||
            errMsg.includes('jwt expired') ||
            errMsg.includes('jwt malformed')
          ) {
            localStorage.removeItem('ta_auth_token');
            localStorage.removeItem('ta_user');
            if (window.location.pathname !== '/auth/login') {
              window.location.href = '/auth/login?expired=1';
            }
          }
        }
        throw new Error(data.message || data.error || 'API request failed');
      }
      return data;
    } catch (err: any) {
      console.warn(`API call to ${path} failed:`, err.message);
      throw err;
    }
  }

  // Auth APIs
  async login(identifier: string, password: string, centreCode?: string) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password, centreCode }),
    });
  }

  async getPublicCentreInfo(code: string) {
    return this.request(`/auth/centre/${encodeURIComponent(code)}`);
  }

  async forgotPassword(identifier: string) {
    return this.request('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ identifier }),
    });
  }

  async verifyOtp(identifier: string, otp: string) {
    return this.request('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ identifier, otp }),
    });
  }

  async resetPassword(identifier: string, otp: string, newPassword: string) {
    return this.request('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ identifier, otp, newPassword }),
    });
  }

  async requestEmailChange(newEmail: string) {
    return this.request('/auth/request-email-change', {
      method: 'POST',
      body: JSON.stringify({ newEmail }),
    });
  }

  async verifyEmailChange(newEmail: string, otp: string) {
    return this.request('/auth/verify-email-change', {
      method: 'POST',
      body: JSON.stringify({ newEmail, otp }),
    });
  }

  async validateInvitation(token: string) {
    return this.request(`/auth/invitation/${encodeURIComponent(token)}`);
  }

  async registerByInvitation(data: any) {
    return this.request('/auth/register-by-invitation', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async verifyRegistrationPayment(data: {
    userId: string;
    paymentReference?: string;
    paymentMethod?: 'ONLINE' | 'OFFLINE';
    screenshotUrl?: string;
    amount?: number;
    idempotencyKey?: string;
  }) {
    return this.request('/auth/verify-registration-payment', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateLocation(coords: { latitude: number; longitude: number; accuracy?: number; address?: string; district?: string }) {
    const res = await this.request('/auth/location', {
      method: 'POST',
      body: JSON.stringify(coords),
    });
    this.setLocationCoordinates(coords.latitude, coords.longitude, coords.accuracy);
    return res;
  }

  async changePassword(newPassword: string, currentPassword?: string) {
    return this.request('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ newPassword, currentPassword }),
    });
  }

  async getMe() {
    return this.request('/auth/me');
  }

  // Service Registry APIs
  async getPlatformServices() {
    return this.request('/services');
  }

  // Instant Service (Certificate & Application Verification)
  async getInstantServiceTypes() {
    return this.request('/instant-service/types');
  }

  async queryInstantService(serviceType: string, applicationNumber: string) {
    const coords = this.getLocationCoordinates();
    return this.request('/instant-service/query', {
      method: 'POST',
      body: JSON.stringify({
        serviceType,
        applicationNumber,
        latitude: coords?.latitude,
        longitude: coords?.longitude,
      }),
    });
  }

  async getInstantServiceHistory() {
    return this.request('/instant-service/history');
  }

  // Partner Management APIs (Admin)
  async getPartners(page = 1, search?: string) {
    let q = `?page=${page}`;
    if (search && search.trim()) q += `&search=${encodeURIComponent(search.trim())}`;
    return this.request(`/admin/partners${q}`);
  }

  async getPartnerById(id: string) {
    return this.request(`/admin/partners/${id}`);
  }

  async createPartner(data: any) {
    return this.request('/admin/partners', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updatePartner(id: string, data: any) {
    return this.request(`/admin/partners/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async generatePartnerInvitation(partnerId: string, expiresInDays = 180) {
    return this.request(`/admin/partners/${partnerId}/invitations`, {
      method: 'POST',
      body: JSON.stringify({ expiresInDays }),
    });
  }

  async getPartnerOnboardInfo(token: string) {
    return this.request(`/admin/partners/onboard/${encodeURIComponent(token)}`);
  }

  async submitPartnerPayment(token: string, data: {
    paymentMethod?: 'ONLINE' | 'OFFLINE';
    paymentReference?: string;
    gatewayPaymentId?: string;
    screenshotUrl?: string;
    notes?: string;
    password?: string;
  }) {
    return this.request(`/admin/partners/onboard/${encodeURIComponent(token)}/pay`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async approvePartner(partnerId: string, notes?: string) {
    return this.request(`/admin/partners/${partnerId}/approve`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    });
  }

  async rejectPartner(partnerId: string, reason?: string) {
    return this.request(`/admin/partners/${partnerId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  // Partner Self-Service Onboarding Invitations APIs
  async getPartnerInvitations() {
    return this.request('/partner/invitations');
  }

  async createPartnerInvitation(data: { shopName: string; mobile: string; email?: string; district?: string; taluk?: string; expiresInMinutes?: number }) {
    return this.request('/partner/invitations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async regeneratePartnerInvitation(id: string) {
    return this.request(`/partner/invitations/${id}/regenerate`, {
      method: 'POST',
    });
  }

  // Official Booking Accounts APIs
  async getAccounts() {
    return this.request('/booking/accounts');
  }

  async saveAccount(data: { username: string; password?: string }) {
    return this.request('/booking/accounts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async verifyAccount(data: { username: string; password?: string }) {
    return this.request('/booking/accounts/verify', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deleteAccount(id: string) {
    return this.request(`/booking/accounts/${id}`, {
      method: 'DELETE',
    });
  }

  // Wallet APIs
  async getWallet() {
    return this.request('/wallet');
  }

  async topupWallet(
    amount: number,
    paymentReference: string,
    extra?: {
      paymentMethod?: 'ONLINE' | 'OFFLINE_QR';
      receiptUrl?: string;
      receiptFileName?: string;
      receiptFileSize?: number;
      idempotencyKey?: string;
    },
  ) {
    return this.request('/wallet/topup', {
      method: 'POST',
      body: JSON.stringify({
        amount,
        paymentReference,
        idempotencyKey: extra?.idempotencyKey || `topup_${Date.now()}`,
        paymentMethod: extra?.paymentMethod || 'OFFLINE_QR',
        receiptUrl: extra?.receiptUrl,
        receiptFileName: extra?.receiptFileName,
        receiptFileSize: extra?.receiptFileSize,
      }),
    });
  }

  async getTransactions(page = 1, limit = 50) {
    return this.request(`/wallet/transactions?page=${page}&limit=${limit}`);
  }

  async requestRefund(amount: number, reason: string, upiId?: string) {
    return this.request('/wallet/refund', {
      method: 'POST',
      body: JSON.stringify({ amount, reason, upiId }),
    });
  }

  // Bookings APIs
  async createBooking(data: any) {
    const coords = this.getLocationCoordinates();
    return this.request('/bookings', {
      method: 'POST',
      body: JSON.stringify({
        ...data,
        latitude: coords?.latitude,
        longitude: coords?.longitude,
        idempotencyKey: `bk_${Date.now()}`,
      }),
    });
  }

  async getBookings(status?: string, page = 1, search?: string) {
    let q = `?page=${page}`;
    if (status && status !== 'ALL') q += `&status=${status}`;
    if (search) q += `&search=${encodeURIComponent(search)}`;
    return this.request(`/bookings${q}`);
  }

  async getBookingById(id: string) {
    return this.request(`/bookings/${id}`);
  }

  async cancelBooking(id: string) {
    return this.request(`/bookings/${id}/cancel`, { method: 'POST' });
  }

  async resolveHumanAction(id: string, action: string, officialReference?: string, notes?: string) {
    return this.request(`/bookings/${id}/resolve-human`, {
      method: 'POST',
      body: JSON.stringify({ action, officialReference, notes }),
    });
  }

  async getBookingConfig() {
    return this.request('/bookings/config');
  }

  async getAdminDashboard() {
    return this.request('/admin/dashboard');
  }

  // Admin Financial Ledger & Collections APIs
  async getLedgerOverview() {
    return this.request('/admin/ledger/overview');
  }

  async getLedgerTransactions(params: {
    page?: number;
    limit?: number;
    status?: string;
    type?: string;
    search?: string;
    dateFrom?: string;
    dateTo?: string;
  } = {}) {
    const q = new URLSearchParams();
    if (params.page) q.set('page', params.page.toString());
    if (params.limit) q.set('limit', params.limit.toString());
    if (params.status && params.status !== 'ALL') q.set('status', params.status);
    if (params.type && params.type !== 'ALL') q.set('type', params.type);
    if (params.search && params.search.trim()) q.set('search', params.search.trim());
    if (params.dateFrom) q.set('dateFrom', params.dateFrom);
    if (params.dateTo) q.set('dateTo', params.dateTo);

    const queryString = q.toString();
    return this.request(`/admin/ledger/transactions${queryString ? `?${queryString}` : ''}`);
  }

  async verifyLedgerTopup(transactionId: string) {
    return this.request(`/admin/ledger/transactions/${transactionId}/verify`, {
      method: 'POST',
    });
  }

  async rejectLedgerTopup(transactionId: string, reason?: string) {
    return this.request(`/admin/ledger/transactions/${transactionId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  async verifyLedgerCentreFee(centreId: string) {
    return this.request(`/admin/ledger/centre-fee/${centreId}/verify`, {
      method: 'POST',
    });
  }

  async rejectLedgerCentreFee(centreId: string, reason?: string) {
    return this.request(`/admin/ledger/centre-fee/${centreId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  async verifyLedgerPartnerFee(partnerId: string, notes?: string) {
    return this.request(`/admin/ledger/partner-fee/${partnerId}/verify`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    });
  }

  async rejectLedgerPartnerFee(partnerId: string, reason?: string) {
    return this.request(`/admin/ledger/partner-fee/${partnerId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  // Centres Management APIs
  async getCentres(page = 1, district?: string, status?: string, search?: string) {
    let q = `?page=${page}`;
    if (district && district !== 'ALL') q += `&district=${encodeURIComponent(district)}`;
    if (status && status !== 'ALL') q += `&status=${encodeURIComponent(status)}`;
    if (search && search.trim()) q += `&search=${encodeURIComponent(search.trim())}`;
    return this.request(`/admin/centres${q}`);
  }

  async getCentreById(id: string) {
    return this.request(`/admin/centres/${id}`);
  }

  async getMyCentre() {
    return this.request('/centres/me');
  }

  async createCentre(data: any) {
    return this.request('/admin/centres', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateCentre(id: string, data: any) {
    return this.request(`/admin/centres/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async activateCentre(id: string) {
    return this.request(`/admin/centres/${id}/activate`, {
      method: 'POST',
    });
  }

  async suspendCentre(id: string) {
    return this.request(`/admin/centres/${id}/suspend`, {
      method: 'POST',
    });
  }

  async reissueCentreActivation(id: string) {
    return this.request(`/admin/centres/${id}/reissue-activation`, {
      method: 'POST',
    });
  }

  async getNetworkStats() {
    return this.request('/centres/stats/network');
  }

  async getRefunds(status?: string) {
    let q = '';
    if (status && status !== 'ALL') q = `?status=${status}`;
    return this.request(`/refunds${q}`);
  }

  async processRefund(
    id: string,
    action: 'APPROVE' | 'REJECT',
    data?: string | { adminNotes?: string; reference?: string; proofUrl?: string },
  ) {
    const payload =
      typeof data === 'string'
        ? { action, adminNotes: data }
        : { action, ...(data || {}) };
    return this.request(`/refunds/${id}/process`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getDiagnostics() {
    return this.request('/diagnostics/audit');
  }

  async getAdvancedAnalytics(params: {
    range?: string;
    startDate?: string;
    endDate?: string;
    service?: string;
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
    userSegment?: string;
  } = {}) {
    const query = new URLSearchParams();
    if (params.range) query.set('range', params.range);
    if (params.startDate) query.set('startDate', params.startDate);
    if (params.endDate) query.set('endDate', params.endDate);
    if (params.service && params.service !== 'ALL') query.set('service', params.service);
    if (params.status && params.status !== 'ALL') query.set('status', params.status);
    if (params.search) query.set('search', params.search);
    if (params.page) query.set('page', params.page.toString());
    if (params.limit) query.set('limit', params.limit.toString());
    if (params.userSegment && params.userSegment !== 'ALL') query.set('userSegment', params.userSegment);

    const queryString = query.toString();
    return this.request(`/diagnostics/analytics${queryString ? `?${queryString}` : ''}`);
  }

  async getUserActivityDetail(userId: string) {
    return this.request(`/diagnostics/user/${encodeURIComponent(userId)}`);
  }

  async getSystemConfig() {
    return this.request('/admin/config');
  }

  async getPublicPaymentConfig() {
    return this.request('/config/payment');
  }

  async updateSystemConfig(config: any) {
    return this.request('/admin/config', {
      method: 'PUT',
      body: JSON.stringify(config),
    });
  }

  async clearAllQueues() {
    return this.request('/admin/queues/clear-all', { method: 'POST' });
  }

  // Partner Payouts & Commission APIs
  async getPartnerCentres(page = 1, district?: string, status?: string, search?: string) {
    let q = `?page=${page}`;
    if (district && district !== 'ALL') q += `&district=${encodeURIComponent(district)}`;
    if (status && status !== 'ALL') q += `&status=${encodeURIComponent(status)}`;
    if (search && search.trim()) q += `&search=${encodeURIComponent(search.trim())}`;
    return this.request(`/partner/centres${q}`);
  }

  async getPartnerPayouts() {
    return this.request('/partner/payouts');
  }

  async requestPartnerPayout(data: { amount: number; upiId: string; accountHolder?: string; notes?: string }) {
    return this.request('/partner/payouts/request', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getAdminPayouts(status?: string) {
    let q = '';
    if (status && status !== 'ALL') q = `?status=${status}`;
    return this.request(`/admin/partners/payouts/all${q}`);
  }

  async settlePartnerPayout(payoutId: string, data: { paymentReference: string; screenshotUrl?: string; adminNotes?: string }) {
    return this.request(`/admin/partners/payouts/${payoutId}/settle`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Worker Fleet Management & Lifecycle APIs
  async getWorkers() {
    return this.request('/workers');
  }

  async getFleetSummary() {
    return this.request('/workers/summary');
  }

  async getWorkerById(id: string) {
    return this.request(`/workers/${encodeURIComponent(id)}`);
  }

  async pairWorker(
    pairingCodeOrPayload:
      | string
      | {
          pairingCode: string;
          machineCode?: string;
          machineName?: string;
          location?: string;
          description?: string;
        },
    machineCode?: string,
  ) {
    const payload =
      typeof pairingCodeOrPayload === 'string'
        ? { pairingCode: pairingCodeOrPayload, machineCode }
        : pairingCodeOrPayload;

    return this.request('/workers/pair', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async adminCreateWorker(data: { machineCode: string; machineName: string; version?: string }) {
    return this.request('/workers/admin/create', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async startWorker(id: string) {
    return this.request(`/workers/${encodeURIComponent(id)}/start`, {
      method: 'POST',
    });
  }

  async stopWorker(id: string, reason?: string) {
    return this.request(`/workers/${encodeURIComponent(id)}/stop`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  async enableWorker(id: string) {
    return this.request(`/workers/${encodeURIComponent(id)}/enable`, {
      method: 'POST',
    });
  }

  async disableWorker(id: string, reason?: string) {
    return this.request(`/workers/${encodeURIComponent(id)}/disable`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  async pauseWorker(id: string, reason?: string) {
    return this.request(`/workers/${encodeURIComponent(id)}/pause`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  async resumeWorker(id: string) {
    return this.request(`/workers/${encodeURIComponent(id)}/resume`, {
      method: 'POST',
    });
  }

  async setMonitorOnly(id: string) {
    return this.request(`/workers/${encodeURIComponent(id)}/monitor-only`, {
      method: 'POST',
    });
  }

  async drainWorker(id: string) {
    return this.request(`/workers/${encodeURIComponent(id)}/drain`, {
      method: 'POST',
    });
  }

  async revokeWorker(id: string, reason: string) {
    return this.request(`/workers/${encodeURIComponent(id)}/revoke`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  async retireWorker(id: string, reason: string) {
    return this.request(`/workers/${encodeURIComponent(id)}/retire`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  async deleteWorker(id: string, reason?: string) {
    return this.request(`/workers/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      body: JSON.stringify({ reason }),
    });
  }

  async getWorkerActivityLogs(workerId: string, params?: {
    page?: number;
    limit?: number;
    severity?: string;
    eventType?: string;
    search?: string;
    jobId?: string;
    from?: string;
    to?: string;
  }) {
    const q = new URLSearchParams();
    if (params?.page) q.set('page', params.page.toString());
    if (params?.limit) q.set('limit', params.limit.toString());
    if (params?.severity && params.severity !== 'ALL') q.set('severity', params.severity);
    if (params?.eventType && params.eventType !== 'ALL') q.set('eventType', params.eventType);
    if (params?.search) q.set('search', params.search);
    if (params?.jobId) q.set('jobId', params.jobId);
    if (params?.from) q.set('from', params.from);
    if (params?.to) q.set('to', params.to);
    const qs = q.toString();
    return this.request(`/workers/${encodeURIComponent(workerId)}/logs${qs ? `?${qs}` : ''}`);
  }

  async getFleetActivityLogs(params?: {
    page?: number;
    limit?: number;
    severity?: string;
    eventType?: string;
    search?: string;
    jobId?: string;
    from?: string;
    to?: string;
  }) {
    const q = new URLSearchParams();
    if (params?.page) q.set('page', params.page.toString());
    if (params?.limit) q.set('limit', params.limit.toString());
    if (params?.severity && params.severity !== 'ALL') q.set('severity', params.severity);
    if (params?.eventType && params.eventType !== 'ALL') q.set('eventType', params.eventType);
    if (params?.search) q.set('search', params.search);
    if (params?.jobId) q.set('jobId', params.jobId);
    if (params?.from) q.set('from', params.from);
    if (params?.to) q.set('to', params.to);
    const qs = q.toString();
    return this.request(`/workers/logs/all${qs ? `?${qs}` : ''}`);
  }

  async getJobAllocations(params?: {
    workerId?: string;
    jobId?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }) {
    const q = new URLSearchParams();
    if (params?.workerId) q.set('workerId', params.workerId);
    if (params?.jobId) q.set('jobId', params.jobId);
    if (params?.status && params.status !== 'ALL') q.set('status', params.status);
    if (params?.limit) q.set('limit', params.limit.toString());
    if (params?.offset !== undefined) q.set('offset', params.offset.toString());
    const qs = q.toString();
    return this.request(`/workers/allocations${qs ? `?${qs}` : ''}`);
  }

  async updateWorkerCapacity(
    workerId: string,
    data: {
      maxConcurrentJobs?: number;
      deploymentType?: string;
      capabilities?: string[];
      adminStatus?: string;
    },
  ) {
    return this.request(`/workers/${encodeURIComponent(workerId)}/capacity`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async triggerAllocationSweep() {
    return this.request('/workers/allocations/sweep', {
      method: 'POST',
    });
  }

  async triggerStaleLeaseRecovery() {
    return this.request('/workers/allocations/recover-stale', {
      method: 'POST',
    });
  }

  async getQueueAndWorkerDiagnostics() {
    return this.request('/workers/diagnostics/queue-health');
  }
}

export const api = new ApiClient();
