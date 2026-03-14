// functions/mpesa/createUser.js
const admin = require("firebase-admin");
const {
  ENTRY_FEE,
  REFERRAL_BONUS_L1,
  REFERRAL_BONUS_L2,
  COLLECTIONS,
  TRANSACTION_TYPES,
  USER_ROLES,
} = require("../constants");

async function createUserAccount(regData, pendingRegId) {
  const {
    username,
    email,
    password,
    phoneNumber,
    referralCode,
  } = regData;

  try {
    // 1. Create Firebase Auth user
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: username,
      phoneNumber,
    });
    const uid = userRecord.uid;

    // 2. Determine referrer UID
    let actualReferrerUid = null;
    if (referralCode) {
      // Try direct ID lookup first
      const directDoc = await admin
        .firestore()
        .collection(COLLECTIONS.USERS)
        .doc(referralCode)
        .get();
      
      if (directDoc.exists) {
        actualReferrerUid = referralCode;
      } else {
        // Try username lookup (case-insensitive)
        const normalizedRef = referralCode.toLowerCase();
        const q = await admin
          .firestore()
          .collection(COLLECTIONS.USERS)
          .where("username_lowercase", "==", normalizedRef)
          .limit(1)
          .get();
        
        if (!q.empty) {
          actualReferrerUid = q.docs[0].id;
        }
      }
    }

    const now = Date.now();
    const normalizedEmail = (email || "").trim().toLowerCase();

    // Chief / Dev roles from Firestore config. config/settings: { chiefEmails: [...], devEmails: [...] }
    const configSnap = await admin.firestore().collection("config").doc("settings").get();
    const config = configSnap.exists ? configSnap.data() : {};
    const chiefEmails = Array.isArray(config.chiefEmails) ? (config.chiefEmails || []).map((e) => (e || "").trim().toLowerCase()) : [];
    const devEmails = Array.isArray(config.devEmails) ? (config.devEmails || []).map((e) => (e || "").trim().toLowerCase()) : [];
    const isChief = chiefEmails.includes(normalizedEmail);
    const isDev = !isChief && devEmails.includes(normalizedEmail);

    const role = isChief ? USER_ROLES.CHIEF : isDev ? USER_ROLES.DEV : USER_ROLES.USER;

    // 3. Create user document in Firestore
    const userData = {
      username: username.trim(),
      username_lowercase: username.trim().toLowerCase(),
      email,
      phoneNumber,
      referredBy: actualReferrerUid,
      balance: 0,
      totalEarnings: 0,
      totalWithdrawn: 0,
      createdAt: now,
      lastLoginAt: now,
      activationPaid: true,
      activationAmount: isChief || isDev ? 0 : ENTRY_FEE,
      role,
      emailNotificationsEnabled: true,
    };

    await admin.firestore()
      .collection(COLLECTIONS.USERS)
      .doc(uid)
      .set(userData);

    // 4. Record activation transaction
    const activationDesc = isChief ? "Chief Account Initialized" : isDev ? "Dev Account Initialized" : "Account Activation Fee Paid";
    await admin.firestore()
      .collection(COLLECTIONS.TRANSACTIONS)
      .add({
        userId: uid,
        amount: isChief || isDev ? 0 : -ENTRY_FEE,
        type: TRANSACTION_TYPES.ACTIVATION,
        description: activationDesc,
        timestamp: now,
      });

    // 5. Handle referral bonuses
    if (actualReferrerUid && !isChief && !isDev) {
      const l1Ref = admin.firestore()
        .collection(COLLECTIONS.USERS)
        .doc(actualReferrerUid);
      
      const l1Snap = await l1Ref.get();
      
      if (l1Snap.exists) {
        // Update L1 referrer's balance
        await l1Ref.update({
          balance: admin.firestore.FieldValue.increment(REFERRAL_BONUS_L1),
          totalEarnings: admin.firestore.FieldValue.increment(REFERRAL_BONUS_L1),
        });

        // Record L1 bonus transaction
        await admin.firestore()
          .collection(COLLECTIONS.TRANSACTIONS)
          .add({
            userId: actualReferrerUid,
            amount: REFERRAL_BONUS_L1,
            type: TRANSACTION_TYPES.REFERRAL_BONUS,
            description: `Referral bonus from ${username} (L1)`,
            timestamp: now,
          });

        // Handle L2 referral if exists
        const l1Data = l1Snap.data();
        const l2Id = l1Data?.referredBy;
        
        if (l2Id) {
          const l2Ref = admin.firestore()
            .collection(COLLECTIONS.USERS)
            .doc(l2Id);
          
          const l2Snap = await l2Ref.get();
          
          if (l2Snap.exists) {
            await l2Ref.update({
              balance: admin.firestore.FieldValue.increment(REFERRAL_BONUS_L2),
              totalEarnings: admin.firestore.FieldValue.increment(REFERRAL_BONUS_L2),
            });

            await admin.firestore()
              .collection(COLLECTIONS.TRANSACTIONS)
              .add({
                userId: l2Id,
                amount: REFERRAL_BONUS_L2,
                type: TRANSACTION_TYPES.REFERRAL_BONUS,
                description: `Indirect referral bonus from ${username} (L2)`,
                timestamp: now,
              });
          }
        }
      }
    }

    return uid;
  } catch (error) {
    if (error.code !== 'auth/email-already-exists') {
      try {
        if (userRecord?.uid) {
          await admin.auth().deleteUser(userRecord.uid);
        }
      } catch (_deleteError) {}
    }
    throw error;
  }
}

module.exports = { createUserAccount };