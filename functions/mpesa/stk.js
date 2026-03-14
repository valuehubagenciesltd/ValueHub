// functions/mpesa/stk.js
const axios = require("axios");
const admin = require("firebase-admin");
const { getAccessToken } = require("./oauth");
const {
  ENTRY_FEE,
  COLLECTIONS,
  PAYMENT_STATUS,
} = require("../constants");

function generateTimestamp() {
  const now = new Date();
  return (
    now.getFullYear().toString() +
    String(now.getMonth() + 1).padStart(2, "0") +
    String(now.getDate()).padStart(2, "0") +
    String(now.getHours()).padStart(2, "0") +
    String(now.getMinutes()).padStart(2, "0") +
    String(now.getSeconds()).padStart(2, "0")
  );
}

function ensurePhoneFormat(phone) {
  // Expect 2547XXXXXXXX
  if (typeof phone !== "string") throw new Error("Phone must be a string");
  const cleaned = phone.replace(/\D/g, "");
  if (!cleaned.startsWith("254") || cleaned.length !== 12) {
    throw new Error("Phone number must be in 2547XXXXXXXX format");
  }
  return cleaned;
}

/**
 * Check if there is already an in-flight (PENDING) payment for this phone.
 * Prevents multiple STK pushes and "user cannot be reached" spam.
 */
async function hasExistingPendingPayment(phone) {
  const normalized = typeof phone === "string" ? phone.replace(/\D/g, "") : "";
  if (!normalized.startsWith("254") || normalized.length !== 12) return false;
  const snap = await admin
    .firestore()
    .collection(COLLECTIONS.PENDING_PAYMENTS)
    .where("phoneNumber", "==", normalized)
    .where("status", "==", PAYMENT_STATUS.PENDING)
    .limit(1)
    .get();
  return !snap.empty;
}

/**
 * initiateSTKPush(phoneNumber, amount, pendingRegId, config)
 *
 * - Validates amount
 * - Rejects if this phone already has a PENDING payment (no duplicate STK)
 * - Calls OAuth to get access token
 * - Posts to Daraja STK push endpoint
 * - Creates pending_payments doc
 * - Schedules an stk_queries job in Firestore for 30s later (used by scheduler)
 */
async function initiateSTKPush(phoneNumber, amount, pendingRegId, config) {
  if (amount !== ENTRY_FEE) {
    throw new Error(`Invalid payment amount. Required: ${ENTRY_FEE}`);
  }

  // Validate phone format (basic)
  const phone = ensurePhoneFormat(phoneNumber);

  // One active payment per phone: never allow duplicate STK or "user cannot be reached" spam
  const existing = await hasExistingPendingPayment(phone);
  if (existing) {
    throw new Error(
      "A payment request is already in progress for this number. Please complete it on your phone or wait 3 minutes before trying again."
    );
  }

  const accessToken = await getAccessToken(config);
  const timestamp = generateTimestamp();

  // Password format: shortcode + passkey + timestamp (base64)
  const password = Buffer.from(
    `${config.mpesa.shortcode}${config.mpesa.passkey}${timestamp}`
  ).toString("base64");

  const payload = {
    BusinessShortCode: config.mpesa.shortcode, // store number
    Password: password,
    Timestamp: timestamp,
    TransactionType: "CustomerBuyGoodsOnline",
    Amount: amount,
    PartyA: phoneNumber,
    PartyB: config.mpesa.till, 
    PhoneNumber: phoneNumber,
    CallBackURL: config.mpesa.callback_url,
    AccountReference: pendingRegId,
    TransactionDesc: "Valuehub Account Activation",
  };

  try {
    const response = await axios.post(
      "https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
      payload,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        timeout: 15000,
      }
    );

    const data = response.data;

    // If Daraja returned non-zero ResponseCode it's an error
    if (data.ResponseCode && String(data.ResponseCode) !== "0") {
      throw new Error(
        data.ResponseDescription || data.errorMessage || "STK push rejected"
      );
    }

    // Save pending payment doc
    const pendingDocRef = admin
      .firestore()
      .collection(COLLECTIONS.PENDING_PAYMENTS)
      .doc(pendingRegId);

    await pendingDocRef.set({
      status: PAYMENT_STATUS.PENDING,
      amount,
      phoneNumber: phone,
      checkoutRequestId: data.CheckoutRequestID,
      merchantRequestId: data.MerchantRequestID,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Schedule a recovery job via collection (runAt = now + 30s)
    try {
      const runAt = admin.firestore.Timestamp.fromMillis(Date.now() + 30 * 1000);
      await admin.firestore().collection(COLLECTIONS.STK_QUERIES).add({
        checkoutRequestId: data.CheckoutRequestID,
        pendingRegId,
        attempts: 0,
        runAt,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    } catch (_err) {}

    return data;
  } catch (error) {
    const mpesaError =
      error.response?.data?.errorMessage ||
      error.response?.data ||
      error.message;
    throw new Error(mpesaError || "Failed to initiate M-Pesa STK push");
  }
}

module.exports = { initiateSTKPush };