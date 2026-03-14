
export interface User {
  id: string;
  username: string;
  email: string;
  phoneNumber: string;
  password?: string;
  referredBy?: string; // ID of the direct referrer (Level 1)
  balance: number;
  totalEarnings: number;
  totalWithdrawn: number;
  createdAt: number;
  lastLoginAt?: number;
  activationPaid: boolean;
  activationAmount: number;
  role?: 'chief' | 'user' | 'dev'; // DB values; display as Admin, Freelancer, Dev in frontend
  username_lowercase: string;
  lastPasswordUpdate?: number;
  emailNotificationsEnabled: boolean;
  lastSupportTicketAt?: number; // Track for rate limiting
  dismissedAnnouncements?: string[]; // Array of announcement IDs the user has cleared
}

export interface Announcement {
  id: string;
  title: string;
  message: string;
  type: 'INFO' | 'WARNING' | 'CRITICAL';
  timestamp: number;
  active: boolean;
}

export interface Transaction {
  id: string;
  userId: string;
  amount: number;
  type: 'EARNING' | 'WITHDRAWAL' | 'REFERRAL_BONUS' | 'ACTIVATION';
  description: string;
  timestamp: number;
  userName?: string; // Helper for admin view
  /** When true, hide from admin ledger view (e.g. transaction cost, maintenance split to devs) */
  hideFromAdminLedger?: boolean;
}

export type WithdrawalStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'REJECTED';

export interface WithdrawalRequest {
  id: string;
  userId: string;
  username: string;
  phoneNumber: string;
  amount: number;
  status: WithdrawalStatus;
  adminNote?: string;
  timestamp: number;
  updatedAt?: number;
}

export interface SupportTicket {
  id: string;
  userId: string;
  username: string;
  email: string;
  phone: string;
  category: 'Technical' | 'Support' | 'Billing' | 'Referral' | 'Other';
  message: string;
  timestamp: number;
  status: 'OPEN' | 'CLOSED';
}

export interface AppState {
  currentUser: User | null;
  users: User[];
  transactions: Transaction[];
  systemBalance: number;
}

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
}
