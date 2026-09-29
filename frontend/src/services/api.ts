import type {
  Deal,
  Interaction,
  MemoryItem,
  MeetingBriefResponse,
  FollowUpResponse,
  ObjectionDetail,
  DealHealthResponse,
  MemoryComparisonResponse,
  MemoryGrowthDataPoint,
  User,
  AuthResponse,
  RegisterPayload,
  LoginPayload
} from '../types';

const BASE_URL = '/api';
const TOKEN_KEY = 'dealmind_token';

export const getStoredToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

export const setStoredToken = (token: string): void => {
  localStorage.setItem(TOKEN_KEY, token);
};

export const clearStoredToken = (): void => {
  localStorage.removeItem(TOKEN_KEY);
};

async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = getStoredToken();
  const headers = new Headers(options.headers || {});

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const res = await fetch(url, {
    ...options,
    headers,
  });

  if (res.status === 401) {
    // Unauthorized: Clear stale token
    clearStoredToken();
    window.dispatchEvent(new Event('dealmind:unauthorized'));
  }

  return res;
}

export const api = {
  // --- Auth APIs ---
  async register(payload: RegisterPayload): Promise<{ message: string; user: User }> {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.detail || 'Registration failed');
    }
    return data;
  },

  async login(payload: LoginPayload): Promise<AuthResponse> {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.detail || 'Invalid email or password.');
    }
    setStoredToken(data.access_token);
    return data;
  },

  async getCurrentUser(): Promise<User> {
    const res = await authFetch(`${BASE_URL}/auth/me`);
    if (!res.ok) throw new Error('Failed to load user profile');
    return res.json();
  },

  logout(): void {
    clearStoredToken();
    window.dispatchEvent(new Event('dealmind:logout'));
  },

  // --- Health & Dashboard ---
  async getHealth() {
    const res = await fetch(`${BASE_URL}/health`);
    return res.json();
  },

  async getDashboard() {
    const res = await authFetch(`${BASE_URL}/dashboard`);
    if (!res.ok) throw new Error('Failed to fetch dashboard data');
    return res.json();
  },

  // --- Deals ---
  async getDeals(): Promise<Deal[]> {
    const res = await authFetch(`${BASE_URL}/deals`);
    if (!res.ok) throw new Error('Failed to fetch deals');
    return res.json();
  },

  async getDeal(id: string): Promise<Deal> {
    const res = await authFetch(`${BASE_URL}/deals/${id}`);
    if (!res.ok) {
      if (res.status === 403) throw new Error('Access forbidden: This deal belongs to another organization.');
      throw new Error('Failed to fetch deal');
    }
    return res.json();
  },

  async createDeal(payload: {
    name: string;
    value: number;
    stage?: string;
    currency?: string;
    probability?: number;
    expected_close_date?: string | null;
    company_name: string;
    industry?: string;
    website?: string;
    size?: string;
    location?: string;
    primary_contact_name?: string;
    primary_contact_email?: string;
  }): Promise<Deal> {
    const res = await authFetch(`${BASE_URL}/deals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.detail || 'Failed to create opportunity.');
    }
    return res.json();
  },

  // --- Interactions ---
  async getInteractions(dealId: string): Promise<Interaction[]> {
    const res = await authFetch(`${BASE_URL}/deals/${dealId}/interactions`);
    if (!res.ok) throw new Error('Failed to fetch interactions');
    return res.json();
  },

  async addInteraction(dealId: string, payload: {
    type: string;
    title: string;
    content: string;
    participants?: string;
    outcome?: string;
    next_steps?: string;
  }) {
    const res = await authFetch(`${BASE_URL}/deals/${dealId}/interactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, deal_id: dealId }),
    });
    if (!res.ok) throw new Error('Failed to add interaction');
    return res.json();
  },

  // --- Memory ---
  async getDealMemory(dealId: string): Promise<MemoryItem[]> {
    const res = await authFetch(`${BASE_URL}/deals/${dealId}/memory`);
    if (!res.ok) throw new Error('Failed to fetch deal memory');
    return res.json();
  },

  async searchMemory(dealId: string, query: string, topK: number = 10): Promise<{ query: string; total_memories: number; memories: MemoryItem[] }> {
    const res = await authFetch(`${BASE_URL}/deals/${dealId}/memory/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, top_k: topK }),
    });
    if (!res.ok) throw new Error('Failed to search memory');
    return res.json();
  },

  // --- AI Intelligence ---
  async generateMeetingBrief(dealId: string, objective?: string): Promise<MeetingBriefResponse> {
    const res = await authFetch(`${BASE_URL}/ai/meeting-brief`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deal_id: dealId, meeting_objective: objective || 'Sales alignment and objection review' }),
    });
    if (!res.ok) throw new Error('Failed to generate meeting brief');
    return res.json();
  },

  async generateFollowUp(dealId: string, tone: string = 'Professional'): Promise<FollowUpResponse> {
    const res = await authFetch(`${BASE_URL}/ai/follow-up`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deal_id: dealId, tone }),
    });
    if (!res.ok) throw new Error('Failed to generate follow-up');
    return res.json();
  },

  async getObjectionAnalysis(dealId: string): Promise<{ deal_id: string; objections: ObjectionDetail[] }> {
    const res = await authFetch(`${BASE_URL}/ai/objection-analysis?deal_id=${dealId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) throw new Error('Failed to fetch objection analysis');
    return res.json();
  },

  async getDealHealth(dealId: string): Promise<DealHealthResponse> {
    const res = await authFetch(`${BASE_URL}/ai/deal-health?deal_id=${dealId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) throw new Error('Failed to calculate deal health');
    return res.json();
  },

  async compareMemoryImpact(dealId: string, query?: string): Promise<MemoryComparisonResponse> {
    const queryParam = query ? `&query=${encodeURIComponent(query)}` : '';
    const res = await authFetch(`${BASE_URL}/ai/memory-impact?deal_id=${dealId}${queryParam}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) throw new Error('Failed to load memory impact comparison');
    return res.json();
  },

  async getMemoryGrowth(): Promise<{ deal_id: string; deal_name: string; data_points: MemoryGrowthDataPoint[]; summary: string }> {
    const res = await authFetch(`${BASE_URL}/analytics/memory-growth`);
    if (!res.ok) throw new Error('Failed to fetch memory growth analytics');
    return res.json();
  },

  async search(query: string) {
    const res = await authFetch(`${BASE_URL}/search?q=${encodeURIComponent(query)}`);
    if (!res.ok) throw new Error('Failed to execute search');
    return res.json();
  }
};
