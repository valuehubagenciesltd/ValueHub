// functions/mpesa/callback.js
const admin = require("firebase-admin");
const {
  COLLECTIONS,
  PAYMENT_STATUS,
  TRANSACTION_TYPES,
  ENTRY_FEE,
} = require("../constants");
const { mapStkFailureMessage } = require("./stkMessages");

/** Delete pending_payments and pending_registrations (e.g. after user sees failure and retries). */
async function deletePendingDocs(pendingRegId) {
  const firestore = admin.firestore();
  await Promise.all([
    firestore.collection(COLLECTIONS.PENDING_PAYMENTS).doc(pendingRegId).delete().catch(() => {}),
    firestore.collection(COLLECTIONS.PENDING_REGISTRATIONS).doc(pendingRegId).delete().catch(() => {}),
  ]);
}

/**
 * Robust M-Pesa callback handler. Expects Daraja STK callback structure.
 */
async function mpesaCallback(req, res) {
  try {
    const stkCallback = req.body?.Body?.stkCallback;

    if (!stkCallback) {
      return res.status(400).json({ error: "Invalid callback payload" });
    }

    const {
      ResultCode,
      ResultDesc,
      CheckoutRequestID,
      CallbackMetadata,
    } = stkCallback;

    // Find pending payment using checkoutRequestId
    const snap = await admin
      .firestore()
      .collection(COLLECTIONS.PENDING_PAYMENTS)
      .where("checkoutRequestId", "==", CheckoutRequestID)
      .limit(1)
      .get();

    if (snap.empty) {
      return res.status(200).json({ ResultCode: 0, ResultDesc: "Accepted" });
    }

    const pendingDoc = snap.docs[0];
    const paymentRef = pendingDoc.ref;
    const pendingRegId = pendingDoc.id;
    const existing = pendingDoc.data();

    // Idempotency: already completed
    if (existing.status === PAYMENT_STATUS.COMPLETED) {
      return res.status(200).json({ ResultCode: 0, ResultDesc: "Already processed" });
    }

    // Handle failed result codes — set FAILED with user-friendly message so client can show it
    if (ResultCode !== 0) {
      const failureReason = mapStkFailureMessage(ResultDesc);
      await paymentRef.set(
        {
          status: PAYMENT_STATUS.FAILED,
          resultCode: ResultCode,
          failureReason,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
      return res.status(200).json({ ResultCode: 0, ResultDesc: "Failure recorded" });
    }

    // Success path: extract metadata safely
    const items = CallbackMetadata?.Item || [];
    const meta = {};
    items.forEach((item) => {
      if (item?.Name) meta[item.Name] = item.Value;
    });

    const amount = meta.Amount;
    const receipt = meta.MpesaReceiptNumber;
    const phone = meta.PhoneNumber;

    if (!amount || !receipt) {
      await paymentRef.set({
        status: PAYMENT_STATUS.FAILED,
        failureReason: mapStkFailureMessage("Missing metadata in callback"),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });
      return res.status(200).json({ ResultCode: 0, ResultDesc: "Handled" });
    }

    // Verify amount
    if (amount !== ENTRY_FEE) {
      await paymentRef.set({
        status: PAYMENT_STATUS.FAILED,
        failureReason: mapStkFailureMessage("Payment amount mismatch"),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });
      return res.status(200).json({ ResultCode: 0, ResultDesc: "Handled" });
    }

    // Mark payment completed
    await paymentRef.set(
      {
        status: PAYMENT_STATUS.COMPLETED,
        amount,
        phoneNumber: phone,
        mpesaReceipt: receipt,
        checkoutRequestId: CheckoutRequestID,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    // Record transaction
    await admin.firestore().collection(COLLECTIONS.TRANSACTIONS).add({
      type: TRANSACTION_TYPES.ACTIVATION,
      amount,
      phoneNumber: phone,
      mpesaReceipt: receipt,
      pendingRegId,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      callbackBody: req.body,
    });

    return res.status(200).json({ ResultCode: 0, ResultDesc: "Success" });
  } catch (error) {
    return res.status(200).json({ ResultCode: 0, ResultDesc: "Handled" });
  }
}

module.exports = { mpesaCallback };