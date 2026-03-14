const admin = require("firebase-admin");
const crypto = require("crypto");

const { COLLECTIONS, ENTRY_FEE, PAYMENT_STATUS, TRANSACTION_TYPES } = require("../constants");

function generateAccountReference() {
  // Short, human-friendly reference: VH + 8 chars (base32-ish via hex slice)
  // Example: VH-8F3A1C2D
  const token = crypto.randomBytes(4).toString("hex").toUpperCase();
  return `VH-${token}`;
}

async function createManualPayReference(pendingRegId, phoneNumber) {
  if (!pendingRegId) throw new Error("Missing pendingRegId");

  const db = admin.firestore();

  // If a ref already exists for this pending reg, return it (idempotent)
  const existingSnap = await db.collection(COLLECTIONS.MANUAL_PAY_REFS).doc(pendingRegId).get();
  if (existingSnap.exists) {
    return existingSnap.data();
  }

  // Ensure pending payment doc exists (so frontend can keep watching same place)
  const pendingPayRef = db.collection(COLLECTIONS.PENDING_PAYMENTS).doc(pendingRegId);
  await pendingPayRef.set(
    {
      status: PAYMENT_STATUS.PENDING,
      amount: ENTRY_FEE,
      phoneNumber: phoneNumber || null,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      paymentMethod: "MANUAL",
    },
    { merge: true }
  );

  // Create unique account reference (retry on rare collisions)
  let accountReference = null;
  for (let i = 0; i < 5; i++) {
    const candidate = generateAccountReference();
    const refSnap = await db.collection(COLLECTIONS.MANUAL_PAY_REFS).where("accountReference", "==", candidate).limit(1).get();
    if (refSnap.empty) {
      accountReference = candidate;
      break;
    }
  }
  if (!accountReference) {
    throw new Error("Failed to generate unique AccountReference");
  }

  const record = {
    pendingRegId,
    accountReference,
    status: "ACTIVE",
    amount: ENTRY_FEE,
    phoneNumber: phoneNumber || null,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  await db.collection(COLLECTIONS.MANUAL_PAY_REFS).doc(pendingRegId).set(record);

  return record;
}

/**
 * handleC2BConfirmation(payload)
 *
 * payload is the C2B confirmation body sent by Safaricom.
 * We match `BillRefNumber` (aka AccountReference) to a manual ref record,
 * then mark pending_payments/{pendingRegId} as COMPLETED.
 */
async function handleC2BConfirmation(payload) {
  const db = admin.firestore();

  const billRef = (payload?.BillRefNumber || payload?.billRefNumber || "").toString().trim();
  const transId = (payload?.TransID || payload?.TransId || payload?.transId || "").toString().trim();
  const transTime = (payload?.TransTime || payload?.transTime || "").toString().trim();
  const msisdn = (payload?.MSISDN || payload?.Msisdn || payload?.msisdn || "").toString().trim();
  const rawAmount = payload?.TransAmount ?? payload?.transAmount ?? payload?.amount;

  if (!billRef) {
    throw new Error("Missing BillRefNumber (AccountReference)");
  }

  // Find matching manual ref
  const refSnap = await db
    .collection(COLLECTIONS.MANUAL_PAY_REFS)
    .where("accountReference", "==", billRef)
    .limit(1)
    .get();

  if (refSnap.empty) {
    // record unmatched for later investigation
    await db.collection(COLLECTIONS.TRANSACTIONS).add({
      type: "UNMATCHED_C2B",
      billRefNumber: billRef,
      transId: transId || null,
      transTime: transTime || null,
      msisdn: msisdn || null,
      amount: rawAmount != null ? Number(rawAmount) : null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      c2bPayload: payload,
    });
    return { matched: false };
  }

  const refDoc = refSnap.docs[0];
  const refData = refDoc.data();
  const pendingRegId = refData.pendingRegId;

  // Idempotency: if already completed, just return ok
  const pendingPayRef = db.collection(COLLECTIONS.PENDING_PAYMENTS).doc(pendingRegId);
  const pendingPaySnap = await pendingPayRef.get();
  if (pendingPaySnap.exists && pendingPaySnap.data()?.status === PAYMENT_STATUS.COMPLETED) {
    return { matched: true, pendingRegId, alreadyCompleted: true };
  }

  const amountNumber = rawAmount != null ? Number(rawAmount) : ENTRY_FEE;

  // Mark completed
  await pendingPayRef.set(
    {
      status: PAYMENT_STATUS.COMPLETED,
      amount: amountNumber,
      phoneNumber: msisdn || refData.phoneNumber || null,
      mpesaReceipt: transId || null,
      accountReference: billRef,
      paymentMethod: "MANUAL",
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      c2bConfirmation: payload,
    },
    { merge: true }
  );

  // Mark ref as used
  await refDoc.ref.set(
    {
      status: "USED",
      usedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      transId: transId || null,
    },
    { merge: true }
  );

  // Transaction record
  await db.collection(COLLECTIONS.TRANSACTIONS).add({
    type: TRANSACTION_TYPES.ACTIVATION,
    amount: amountNumber,
    phoneNumber: msisdn || refData.phoneNumber || null,
    mpesaReceipt: transId || null,
    pendingRegId,
    accountReference: billRef,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    c2bPayload: payload,
  });

  return { matched: true, pendingRegId };
}

module.exports = {
  createManualPayReference,
  handleC2BConfirmation,
};

