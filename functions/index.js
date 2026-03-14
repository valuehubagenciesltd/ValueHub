// functions/index.js
const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");

// initialize admin
admin.initializeApp();

const { initiateSTKPush } = require("./mpesa/stk");
const { mpesaCallback } = require("./mpesa/callback");
const { queryStkStatus } = require("./mpesa/query");
const { mapStkFailureMessage } = require("./mpesa/stkMessages");
const { createManualPayReference, handleC2BConfirmation } = require("./mpesa/manual");
const { sendActivityNotification: sendActivityEmail, sendPasswordResetCodeEmail, VALID_TYPES } = require("./email/notify");

const {
  COLLECTIONS,
  PAYMENT_STATUS,
} = require("./constants");

/**
 * getConfig() - loads functions config and warns about missing values
 */
function getConfig() {
  try {
    return functions.config() || {};
  } catch (error) {
    throw new Error("Functions config not available");
  }
}

// -------------------------
// 1. Callable startStkPush
// -------------------------
exports.startStkPush = functions.https.onCall(async (data, context) => {
  const { phoneNumber, amount, pendingRegId } = data || {};
  const amountNumber = Number(amount);

  if (!phoneNumber || !pendingRegId || Number.isNaN(amountNumber)) {
    throw new functions.https.HttpsError("invalid-argument", "Missing phoneNumber, amount, or pendingRegId");
  }

  try {
    const config = getConfig();

    const response = await initiateSTKPush(phoneNumber, amountNumber, pendingRegId, config);

    return {
      success: true,
      checkoutRequestId: response.CheckoutRequestID,
      merchantRequestId: response.MerchantRequestID,
      responseDescription: response.ResponseDescription || response.CustomerMessage,
    };
  } catch (err) {
    throw new functions.https.HttpsError("internal", err?.message || "Failed to initiate STK push");
  }
});

// -------------------------
// 2. HTTP startStkPushHttp
// -------------------------
exports.startStkPushHttp = functions.https.onRequest(async (req, res) => {
  // CORS (adjust for production)
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(204).send("");

  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { phoneNumber, amount, pendingRegId } = req.body || {};
  const amountNumber = Number(amount);

  if (!phoneNumber || !pendingRegId || Number.isNaN(amountNumber)) {
    return res.status(400).json({ error: "Missing or invalid phoneNumber, amount, or pendingRegId" });
  }

  try {
    const config = getConfig();

    const response = await initiateSTKPush(phoneNumber, amountNumber, pendingRegId, config);

    return res.status(200).json({
      success: true,
      checkoutRequestId: response.CheckoutRequestID,
      merchantRequestId: response.MerchantRequestID,
      responseDescription: response.ResponseDescription || response.CustomerMessage,
    });
  } catch (err) {
    const msg = err?.message || "Failed to initiate STK push";
    const status = msg.includes("already in progress") ? 429 : 500;
    return res.status(status).json({ error: msg });
  }
});

// -------------------------
// 2b. HTTP createManualPayRef
// -------------------------
exports.createManualPayRef = functions.https.onRequest(async (req, res) => {
  // CORS (adjust for production)
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(204).send("");
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { pendingRegId, phoneNumber } = req.body || {};
  if (!pendingRegId) {
    return res.status(400).json({ error: "Missing pendingRegId" });
  }

  try {
    const ref = await createManualPayReference(pendingRegId, phoneNumber);
    return res.status(200).json({
      success: true,
      pendingRegId: ref.pendingRegId,
      accountReference: ref.accountReference,
      amount: ref.amount,
    });
  } catch (err) {
    return res.status(500).json({ error: err?.message || "Failed to create manual reference" });
  }
});

// -------------------------
// 3. M-Pesa callback endpoint
// -------------------------
exports.mpesaCallback = functions.https.onRequest(async (req, res) => {
  try {
    await mpesaCallback(req, res);
  } catch (err) {
    return res.status(200).json({ ResultCode: 0, ResultDesc: "Handled" });
  }
});

// -------------------------
// 3b. C2B confirmation endpoint (PayBill manual payments)
// -------------------------
exports.c2bConfirmation = functions.https.onRequest(async (req, res) => {
  // Safaricom C2B endpoints are server-to-server; still allow simple CORS for manual testing tools.
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(204).send("");
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const result = await handleC2BConfirmation(req.body);
    return res.status(200).json({ ResultCode: 0, ResultDesc: result?.matched ? "Accepted" : "Accepted (unmatched)" });
  } catch (err) {
    return res.status(200).json({ ResultCode: 0, ResultDesc: "Handled" });
  }
});

// -------------------------
// 4. Scheduler: process Stk Queries every 1 minute
// -------------------------
exports.processStkQueries = functions.pubsub
  .schedule("every 1 minutes")
  .onRun(async () => {
    const now = admin.firestore.Timestamp.now();
    const qSnap = await admin
      .firestore()
      .collection(COLLECTIONS.STK_QUERIES)
      .where("runAt", "<=", now)
      .limit(30)
      .get();

    if (qSnap.empty) {
      return null;
    }

    const config = getConfig();

    for (const doc of qSnap.docs) {
      const job = doc.data();
      const docRef = doc.ref;

      try {
        await docRef.update({ attempts: (job.attempts || 0) + 1, lastTriedAt: admin.firestore.FieldValue.serverTimestamp() });
      } catch (_err) {}

      try {
        const queryRes = await queryStkStatus(job.checkoutRequestId, config);

        // Load pending payment doc
        const pendingRef = admin.firestore().collection(COLLECTIONS.PENDING_PAYMENTS).doc(job.pendingRegId);
        const pendingSnap = await pendingRef.get();

        if (!pendingSnap.exists) {
          await docRef.delete().catch(() => {});
          continue;
        }

        const pending = pendingSnap.data();
        if (pending.status === PAYMENT_STATUS.COMPLETED) {
          await docRef.delete().catch(() => {});
          continue;
        }

        // Determine success/failure codes (Daraja variations)
        const respCode = queryRes?.ResponseCode ?? queryRes?.ResultCode ?? queryRes?.resultCode;
        const respDesc = queryRes?.ResponseDescription ?? queryRes?.ResultDesc ?? JSON.stringify(queryRes);

        if (String(respCode) === "0" || Number(respCode) === 0) {
          // extract metadata
          const items =
            queryRes?.CallbackMetadata?.Item ||
            queryRes?.Body?.stkCallback?.CallbackMetadata?.Item ||
            [];

          const meta = {};
          (items || []).forEach((it) => {
            if (it?.Name) meta[it.Name] = it.Value;
          });

          const amount = meta.Amount ?? pending.amount;
          const receipt = meta.MpesaReceiptNumber ?? meta.ReceiptNumber ?? null;
          const phone = meta.PhoneNumber ?? pending.phoneNumber;

          // Mark completed
          await pendingRef.set({
            status: PAYMENT_STATUS.COMPLETED,
            amount,
            phoneNumber: phone,
            mpesaReceipt: receipt,
            checkoutRequestId: job.checkoutRequestId,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            queryResponse: queryRes,
          }, { merge: true });

          // Add transaction
          await admin.firestore().collection(COLLECTIONS.TRANSACTIONS).add({
            type: "ACTIVATION",
            amount: amount,
            phoneNumber: phone,
            mpesaReceipt: receipt,
            pendingRegId: job.pendingRegId,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            queryResponse: queryRes,
          });

          await docRef.delete().catch(() => {});
          continue;
        } else {
          // treat as failed — set FAILED with user-friendly message so client can show it
          const failureReason = mapStkFailureMessage(respDesc);
          await pendingRef.set({
            status: PAYMENT_STATUS.FAILED,
            resultCode: respCode,
            failureReason,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            queryResponse: queryRes,
          }, { merge: true });

          await docRef.delete().catch(() => {});
          continue;
        }
      } catch (err) {
        const attempts = (job.attempts || 0) + 1;
        if (attempts < 3) {
          const nextRun = admin.firestore.Timestamp.fromMillis(Date.now() + 30 * 1000 * attempts);
          await docRef.update({ runAt: nextRun }).catch(() => {});
        } else {
          // failed after retries — set FAILED so user sees "Payment timed out"
          const pendingRef = admin.firestore().collection(COLLECTIONS.PENDING_PAYMENTS).doc(job.pendingRegId);
          await pendingRef.set({
            status: PAYMENT_STATUS.FAILED,
            failureReason: mapStkFailureMessage("STK query error"),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          }, { merge: true });

          await docRef.delete().catch(() => {});
        }
      }
    }

    return null;
  });

// -------------------------
// 5. Callable: send activity notification email
// -------------------------
exports.sendActivityNotification = functions.https.onCall(async (data, context) => {
  const { type, email, ...payload } = data || {};
  if (!type || !VALID_TYPES.includes(type)) {
    throw new functions.https.HttpsError("invalid-argument", "Missing or invalid type");
  }
  const toEmail = (email || (context.auth && context.auth.token && context.auth.token.email) || "").toString().trim();
  if (!toEmail || !toEmail.includes("@")) {
    throw new functions.https.HttpsError("invalid-argument", "Valid email required");
  }
  if (context.auth && context.auth.token && context.auth.token.email) {
    const authEmail = (context.auth.token.email || "").toString().trim().toLowerCase();
    if (toEmail.toLowerCase() !== authEmail) {
      throw new functions.https.HttpsError("permission-denied", "Email must match signed-in user");
    }
  }

  try {
    const config = getConfig();
    const result = await sendActivityEmail(toEmail, type, payload, config);
    return { success: true, sent: result.sent };
  } catch (err) {
    throw new functions.https.HttpsError("internal", err?.message || "Failed to send notification");
  }
});

// -------------------------
// 6. Callable: request password reset code (6-digit, email)
// -------------------------
const CODE_EXPIRY_MINUTES = 10;
const CODE_COOLDOWN_SECONDS = 120;

function generateSixDigitCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

exports.requestPasswordResetCode = functions.https.onCall(async (data, context) => {
  const email = (data?.email || "").toString().trim().toLowerCase();
  if (!email || !email.includes("@")) {
    throw new functions.https.HttpsError("invalid-argument", "Valid email is required");
  }

  const firestore = admin.firestore();
  const usersRef = firestore.collection(COLLECTIONS.USERS);
  const codesRef = firestore.collection(COLLECTIONS.PASSWORD_RESET_CODES);
  const docId = email;

  try {
    const userSnap = await usersRef.where("email", "==", email).limit(1).get();
    if (userSnap.empty) {
      return { success: false, error: "not-found" };
    }

    const existing = await codesRef.doc(docId).get();
    if (existing.exists) {
      const created = existing.data()?.createdAt?.toMillis?.() || 0;
      if (Date.now() - created < CODE_COOLDOWN_SECONDS * 1000) {
        throw new functions.https.HttpsError(
          "resource-exhausted",
          "Please wait a few minutes before requesting another code."
        );
      }
    }

    const code = generateSixDigitCode();
    const expiresAt = admin.firestore.Timestamp.fromMillis(
      Date.now() + CODE_EXPIRY_MINUTES * 60 * 1000
    );

    await codesRef.doc(docId).set({
      code,
      email,
      expiresAt,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    const config = getConfig();
    const result = await sendPasswordResetCodeEmail(email, code, config);
    if (!result.sent) {
      await codesRef.doc(docId).delete().catch(() => {});
      throw new functions.https.HttpsError("internal", "Failed to send email. Please try again.");
    }

    return { success: true };
  } catch (err) {
    if (err instanceof functions.https.HttpsError) throw err;
    throw new functions.https.HttpsError("internal", err?.message || "Request failed");
  }
});

// -------------------------
// 7. Callable: verify reset code and set new password
// -------------------------
exports.verifyResetCodeAndSetPassword = functions.https.onCall(async (data, context) => {
  const email = (data?.email || "").toString().trim().toLowerCase();
  const code = (data?.code || "").toString().trim();
  const newPassword = (data?.newPassword || "").toString();

  if (!email || !email.includes("@")) {
    throw new functions.https.HttpsError("invalid-argument", "Valid email is required");
  }
  if (code.length !== 6) {
    throw new functions.https.HttpsError("invalid-argument", "Please enter the 6-digit code.");
  }
  if (!newPassword || newPassword.length < 6) {
    throw new functions.https.HttpsError("invalid-argument", "Password must be at least 6 characters.");
  }

  const firestore = admin.firestore();
  const codesRef = firestore.collection(COLLECTIONS.PASSWORD_RESET_CODES);
  const docId = email;

  try {
    const codeSnap = await codesRef.doc(docId).get();
    if (!codeSnap.exists) {
      throw new functions.https.HttpsError("not-found", "Invalid or expired code. Please request a new one.");
    }

    const { code: storedCode, expiresAt } = codeSnap.data();
    if (storedCode !== code) {
      throw new functions.https.HttpsError("invalid-argument", "Invalid code. Please try again.");
    }
    const expiryMs = expiresAt?.toMillis?.() ?? 0;
    if (Date.now() > expiryMs) {
      await codesRef.doc(docId).delete().catch(() => {});
      throw new functions.https.HttpsError("failed-precondition", "Code has expired. Please request a new one.");
    }

    let userRecord;
    try {
      userRecord = await admin.auth().getUserByEmail(email);
    } catch (authErr) {
      throw new functions.https.HttpsError("not-found", "Account not found.");
    }

    await admin.auth().updateUser(userRecord.uid, { password: newPassword });
    await codesRef.doc(docId).delete().catch(() => {});

    const config = getConfig();
    await sendActivityEmail(email, "password_changed", {}, config).catch(() => {});

    return { success: true };
  } catch (err) {
    if (err instanceof functions.https.HttpsError) throw err;
    throw new functions.https.HttpsError("internal", err?.message || "Update failed");
  }
});