import {
  User,
  Quest,
  ShopItem,
  InventoryItem,
  QuestCompletionResult,
  AttributeType,
  QuestDifficulty,
} from '../types';
import { localRpgEngine, initLocalNeuralVault } from './localRpgEngine';

const TOKEN_KEY = 'liferpg_jwt_token';

let backendAvailable: boolean | null = null;

function isHostWithoutBackend(err: any): boolean {
  if (!err) return false;
  const msg = String(err.message || '').toLowerCase();
  return (
    msg.includes('404') ||
    msg.includes('405') ||
    msg.includes('502') ||
    msg.includes('503') ||
    msg.includes('504') ||
    msg.includes('failed to fetch') ||
    msg.includes('network') ||
    msg.includes('unexpected token') ||
    msg.includes('local fallback')
  );
}

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
  if (backendAvailable === false) {
    throw new Error('HTTP error 404 (Static host - offline local vault active)');
  }

  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };

  if (token && !token.startsWith('local_token_')) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(endpoint, {
      ...options,
      headers,
    });
  } catch (netErr: any) {
    backendAvailable = false;
    throw new Error(netErr?.message || 'Network request failed');
  }

  // Check if server returned HTML (common on Vercel SPA rewrite fallback for missing API endpoints)
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('text/html')) {
    backendAvailable = false;
    throw new Error(`HTTP error ${response.status} (SPA HTML rewrite received)`);
  }

  let data: any = {};
  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (!response.ok) {
    if (response.status === 404 || response.status >= 500) {
      backendAvailable = false;
    }
    throw new Error(data.error || `HTTP error ${response.status}`);
  }

  backendAvailable = true;
  return data as T;
}

export const api = {
  // Auth
  login: async (identifier: string, password: string) => {
    if (backendAvailable === false) {
      return await localRpgEngine.login(identifier, password);
    }
    try {
      return await request<{ user: User; token: string; message: string }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ identifier, password }),
      });
    } catch (err: any) {
      if (isHostWithoutBackend(err)) {
        backendAvailable = false;
        return await localRpgEngine.login(identifier, password);
      }
      throw err;
    }
  },

  register: async (username: string, email: string, password: string, avatar?: string) => {
    if (backendAvailable === false) {
      return await localRpgEngine.register(username, email, password, avatar);
    }
    try {
      return await request<{ user: User; token: string; message: string }>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ username, email, password, avatar }),
      });
    } catch (err: any) {
      if (isHostWithoutBackend(err)) {
        backendAvailable = false;
        return await localRpgEngine.register(username, email, password, avatar);
      }
      throw err;
    }
  },

  demoLogin: async () => {
    if (backendAvailable === false) {
      return await localRpgEngine.demoLogin();
    }
    try {
      return await request<{ user: User; token: string; message: string }>('/api/auth/demo', {
        method: 'POST',
      });
    } catch (err: any) {
      if (isHostWithoutBackend(err)) {
        backendAvailable = false;
        return await localRpgEngine.demoLogin();
      }
      throw err;
    }
  },

  logout: async () => {
    removeStoredToken();
    await localRpgEngine.logout();
    if (backendAvailable !== false) {
      try {
        await request('/api/auth/logout', { method: 'POST' });
      } catch {
        // Ignore
      }
    }
  },

  getCurrentSession: async () => {
    if (backendAvailable === false) {
      return await localRpgEngine.getCurrentSession();
    }
    try {
      return await request<{ user: User; inventory: InventoryItem[] }>('/api/auth/me');
    } catch (err: any) {
      if (isHostWithoutBackend(err)) {
        backendAvailable = false;
        return await localRpgEngine.getCurrentSession();
      }
      throw err;
    }
  },

  // Quests
  getQuests: async () => {
    if (backendAvailable === false) {
      return await localRpgEngine.getQuests();
    }
    try {
      return await request<{ quests: Quest[] }>('/api/quests');
    } catch (err: any) {
      if (isHostWithoutBackend(err)) {
        backendAvailable = false;
        return await localRpgEngine.getQuests();
      }
      throw err;
    }
  },

  createQuest: async (data: {
    title: string;
    description: string;
    attribute: AttributeType;
    difficulty: QuestDifficulty;
    dueDate?: string | null;
  }) => {
    if (backendAvailable === false) {
      return await localRpgEngine.createQuest(data);
    }
    try {
      return await request<{ quest: Quest; message: string }>('/api/quests', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch (err: any) {
      if (isHostWithoutBackend(err)) {
        backendAvailable = false;
        return await localRpgEngine.createQuest(data);
      }
      throw err;
    }
  },

  updateQuest: async (id: string, updates: Partial<Quest>) => {
    if (backendAvailable === false) {
      return await localRpgEngine.updateQuest(id, updates);
    }
    try {
      return await request<{ quest: Quest }>('/api/quests/' + id, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      });
    } catch (err: any) {
      if (isHostWithoutBackend(err)) {
        backendAvailable = false;
        return await localRpgEngine.updateQuest(id, updates);
      }
      throw err;
    }
  },

  deleteQuest: async (id: string) => {
    if (backendAvailable === false) {
      return await localRpgEngine.deleteQuest(id);
    }
    try {
      return await request<{ message: string; id: string }>('/api/quests/' + id, {
        method: 'DELETE',
      });
    } catch (err: any) {
      if (isHostWithoutBackend(err)) {
        backendAvailable = false;
        return await localRpgEngine.deleteQuest(id);
      }
      throw err;
    }
  },

  completeQuest: async (id: string) => {
    if (backendAvailable === false) {
      return await localRpgEngine.completeQuest(id);
    }
    try {
      return await request<QuestCompletionResult>('/api/quests/' + id + '/complete', {
        method: 'POST',
      });
    } catch (err: any) {
      if (isHostWithoutBackend(err)) {
        backendAvailable = false;
        return await localRpgEngine.completeQuest(id);
      }
      throw err;
    }
  },

  // Armory
  getArmoryCatalog: async () => {
    if (backendAvailable === false) {
      return await localRpgEngine.getArmoryCatalog();
    }
    try {
      return await request<{
        catalog: (ShopItem & { owned: boolean; equipped: boolean; inventoryId: string | null })[];
        userCredits: number;
      }>('/api/armory/items');
    } catch (err: any) {
      if (isHostWithoutBackend(err)) {
        backendAvailable = false;
        return await localRpgEngine.getArmoryCatalog();
      }
      throw err;
    }
  },

  buyItem: async (itemId: string) => {
    if (backendAvailable === false) {
      return await localRpgEngine.buyItem(itemId);
    }
    try {
      return await request<{ user: User; item: InventoryItem; message: string }>('/api/armory/buy', {
        method: 'POST',
        body: JSON.stringify({ itemId }),
      });
    } catch (err: any) {
      if (isHostWithoutBackend(err)) {
        backendAvailable = false;
        return await localRpgEngine.buyItem(itemId);
      }
      throw err;
    }
  },

  equipItem: async (inventoryId: string) => {
    if (backendAvailable === false) {
      return await localRpgEngine.equipItem(inventoryId);
    }
    try {
      return await request<{ user: User; item: ShopItem; message: string }>('/api/armory/equip', {
        method: 'POST',
        body: JSON.stringify({ inventoryId }),
      });
    } catch (err: any) {
      if (isHostWithoutBackend(err)) {
        backendAvailable = false;
        return await localRpgEngine.equipItem(inventoryId);
      }
      throw err;
    }
  },

  // Character
  allocateStat: async (attribute: AttributeType) => {
    if (backendAvailable === false) {
      return await localRpgEngine.allocateStat(attribute);
    }
    try {
      return await request<{ user: User; message: string }>('/api/character/allocate-stat', {
        method: 'POST',
        body: JSON.stringify({ attribute }),
      });
    } catch (err: any) {
      if (isHostWithoutBackend(err)) {
        backendAvailable = false;
        return await localRpgEngine.allocateStat(attribute);
      }
      throw err;
    }
  },

  updateProfile: async (data: { title?: string; avatar?: string; theme?: string }) => {
    if (backendAvailable === false) {
      return await localRpgEngine.updateProfile(data);
    }
    try {
      return await request<{ user: User }>('/api/character/profile', {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    } catch (err: any) {
      if (isHostWithoutBackend(err)) {
        backendAvailable = false;
        return await localRpgEngine.updateProfile(data);
      }
      throw err;
    }
  },
};

// Initialize local vault
initLocalNeuralVault();
