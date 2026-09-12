import { User, Quest, ShopItem, InventoryItem, QuestCompletionResult, AttributeType, QuestDifficulty } from '../types';

const TOKEN_KEY = 'liferpg_jwt_token';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeStoredToken() {
  localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || `HTTP error ${response.status}`);
  }

  return data as T;
}

export const api = {
  // Auth
  login: (identifier: string, password: string) =>
    request<{ user: User; token: string; message: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password }),
    }),

  register: (username: string, email: string, password: string, avatar?: string) =>
    request<{ user: User; token: string; message: string }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password, avatar }),
    }),

  demoLogin: () =>
    request<{ user: User; token: string; message: string }>('/api/auth/demo', {
      method: 'POST',
    }),

  logout: async () => {
    removeStoredToken();
    try {
      await request('/api/auth/logout', { method: 'POST' });
    } catch {
      // Ignore
    }
  },

  getCurrentSession: () =>
    request<{ user: User; inventory: InventoryItem[] }>('/api/auth/me'),

  // Quests
  getQuests: () =>
    request<{ quests: Quest[] }>('/api/quests'),

  createQuest: (data: {
    title: string;
    description: string;
    attribute: AttributeType;
    difficulty: QuestDifficulty;
    dueDate?: string | null;
  }) =>
    request<{ quest: Quest; message: string }>('/api/quests', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateQuest: (id: string, updates: Partial<Quest>) =>
    request<{ quest: Quest }>('/api/quests/' + id, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    }),

  deleteQuest: (id: string) =>
    request<{ message: string; id: string }>('/api/quests/' + id, {
      method: 'DELETE',
    }),

  completeQuest: (id: string) =>
    request<QuestCompletionResult>('/api/quests/' + id + '/complete', {
      method: 'POST',
    }),

  // Armory
  getArmoryCatalog: () =>
    request<{ catalog: (ShopItem & { owned: boolean; equipped: boolean; inventoryId: string | null })[]; userCredits: number }>('/api/armory/items'),

  buyItem: (itemId: string) =>
    request<{ user: User; item: InventoryItem; message: string }>('/api/armory/buy', {
      method: 'POST',
      body: JSON.stringify({ itemId }),
    }),

  equipItem: (inventoryId: string) =>
    request<{ user: User; item: ShopItem; message: string }>('/api/armory/equip', {
      method: 'POST',
      body: JSON.stringify({ inventoryId }),
    }),

  // Character
  allocateStat: (attribute: AttributeType) =>
    request<{ user: User; message: string }>('/api/character/allocate-stat', {
      method: 'POST',
      body: JSON.stringify({ attribute }),
    }),

  updateProfile: (data: { title?: string; avatar?: string; theme?: string }) =>
    request<{ user: User }>('/api/character/profile', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
};
