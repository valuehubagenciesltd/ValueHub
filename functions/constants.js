// functions/constants.js
module.exports = {
  ENTRY_FEE: 25,
  REFERRAL_BONUS_L1: 15,
  REFERRAL_BONUS_L2: 5,

  // Firestore collection names
  COLLECTIONS: {
    PENDING_PAYMENTS: "pending_payments",
    TRANSACTIONS: "transactions",
    USERS: "users",
    SUPPORT_TICKETS: "support_tickets",
    STK_QUERIES: "stk_queries",
    PENDING_REGISTRATIONS: "pending_registrations",
    MANUAL_PAY_REFS: "manual_pay_refs",
    PASSWORD_RESET_CODES: "password_reset_codes",
  },

  // Payment statuses
  PAYMENT_STATUS: {
    PENDING: "PENDING",
    COMPLETED: "COMPLETED",
    FAILED: "FAILED",
  },

  // Transaction semantics
  TRANSACTION_TYPES: {
    ACTIVATION: "ACTIVATION",
    WITHDRAWAL: "WITHDRAWAL",
    REFERRAL_BONUS: "REFERRAL_BONUS",
    OTHER: "OTHER",
  },

  USER_ROLES: {
    CHIEF: "chief",
    USER: "user",
    DEV: "dev",
  },

  WITHDRAWAL_TRANSACTION_FEE: 10,
  WITHDRAWAL_MAINTENANCE_FEE: 70,
};