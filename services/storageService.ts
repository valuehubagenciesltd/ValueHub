
import { User, Transaction, AppState } from '../types';

const STORAGE_KEY = 'valuehub_db_v1';

const INITIAL_STATE: AppState = {
  currentUser: null,
  users: [
    {
      id: 'admin',
      username: 'ValueHubMain',
      // Fix: Add missing required property 'username_lowercase'
      username_lowercase: 'valuehubmain',
      email: 'admin@valuehub.com',
      phoneNumber: '0700000000',
      balance: 0,
      totalEarnings: 0,
      totalWithdrawn: 0,
      createdAt: Date.now(),
      activationPaid: true,
      activationAmount: 0,
      // Fix: Change 'admin' to 'chief' as defined in the User role type
      role: 'chief',
      // Fix: Add missing required property 'emailNotificationsEnabled'
      emailNotificationsEnabled: true
    }
  ],
  transactions: [],
  systemBalance: 0
};

export const loadState = (): AppState => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return INITIAL_STATE;
  try {
    return JSON.parse(stored);
  } catch {
    return INITIAL_STATE;
  }
};

export const saveState = (state: AppState) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};
