// Single source of truth for app config. For production, consider loading from Firebase Remote Config or env.
export const APP_NAME = "Valuehub";
export const MIN_WITHDRAWAL = 380;
export const WITHDRAWAL_TRANSACTION_FEE = 10;  
export const WITHDRAWAL_MAINTENANCE_FEE = 70;  
export const ENTRY_FEE = 25;
export const REFERRAL_BONUS_L1 = 15;
export const REFERRAL_BONUS_L2 = 5;

/** Map DB role to frontend display label (DB stays chief/user/dev). */
export function getRoleDisplayLabel(role?: string): string {
  if (role === 'chief') return 'Admin';
  if (role === 'user') return 'Freelancer';
  if (role === 'dev') return 'Dev';
  return 'Member';
}

export const NAVIGATION_LINKS = [
  { name: 'Home', icon: 'fa-house', path: '/dashboard' },
  { name: 'Earn', icon: 'fa-sack-dollar', path: '/earn' },
  { name: 'Settings', icon: 'fa-cog', path: '/settings' },
];
