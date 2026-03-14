import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
const { Link, useSearchParams, useNavigate } = ReactRouterDOM as any;

import * as fbFirestore from 'firebase/firestore';
const {
  doc, setDoc, getDoc, updateDoc, increment, addDoc,
  collection, query, where, getDocs, limit, onSnapshot,
    deleteDoc
} = fbFirestore as any;
import { auth, db, createUserWithEmailAndPassword, getFunctions, httpsCallable } from '../../firebase';
import { ENTRY_FEE, REFERRAL_BONUS_L1, REFERRAL_BONUS_L2, APP_NAME } from '../../constants';
import { useToast } from '../../context/ToastContext';


const Register: React.FC = () => {
  const toast = useToast();
  const [searchParams] = useSearchParams();
  const urlRefId = searchParams.get('ref');
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
    referralCode: urlRefId || ''
  });

  const [inviterName, setInviterName] = useState<string | null>(null);
  const [usernameSuggestions, setUsernameSuggestions] = useState<string[]>([]);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'available' | 'taken'>('idle');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'IDLE' | 'PENDING' | 'SUCCESS' | 'FAILED'>('IDLE');
  const [lastFailureReason, setLastFailureReason] = useState<string | null>(null);
  const [pendingRegId, setPendingRegId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [emailStatus, setEmailStatus] = useState<'idle' | 'available' | 'taken'>('idle');
  const [isCheckingPhone, setIsCheckingPhone] = useState(false);
  const [phoneStatus, setPhoneStatus] = useState<'idle' | 'available' | 'taken'>('idle');

  // Add phone number validation hint
  const [phoneError, setPhoneError] = useState<string | null>(null);

  // STK listener / timeout refs to ensure proper cleanup on unmount
  const stkUnsubscribeRef = useRef<null | (() => void)>(null);
  const stkTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stkCleanedUpRef = useRef(false);
  const isMountedRef = useRef(true);
  const hasFinalizedRegistrationRef = useRef(false);
  const checkEmail = async (email: string) => {
    if (!email || !email.includes('@')) {
      setEmailStatus('idle');
      return;
    }
    setIsCheckingEmail(true);
    try {
      const normalized = email.trim().toLowerCase();
      const q = query(collection(db, 'users'), where("email", "==", normalized), limit(1));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        setEmailStatus('taken');
      } else {
        setEmailStatus('available');
      }
    } catch (err) {
      console.error("Error checking email:", err);
    } finally {
      setIsCheckingEmail(false);
    }
  };

  const checkPhone = async (phone: string) => {
    if (!phone) {
      setPhoneStatus('idle');
      return;
    }
    setIsCheckingPhone(true);
    try {
      // Format phone for consistent checking
      let formattedPhone = phone;
      try {
        formattedPhone = formatPhoneNumberForMpesa(phone);
      } catch (e) {
        // If formatting fails, use original for check
      }

    } catch (err) {
      console.error("Error checking phone:", err);
    } finally {
      setIsCheckingPhone(false);
    }
  };
  // Email validation with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.email) checkEmail(formData.email);
    }, 600);
    return () => clearTimeout(timer);
  }, [formData.email]);

  // Phone validation with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.phoneNumber) checkPhone(formData.phoneNumber);
    }, 600);
    return () => clearTimeout(timer);
  }, [formData.phoneNumber]);

  // Add this useEffect for phone validation
  useEffect(() => {
    const validatePhone = () => {
      if (!formData.phoneNumber) {
        setPhoneError(null);
        return;
      }

      try {
        const formatted = formatPhoneNumberForMpesa(formData.phoneNumber);
        if (!isValidSafaricomNumber(formatted)) {
          setPhoneError("Please enter a valid Safaricom number");
        } else {
          setPhoneError(null);
        }
      } catch (err: any) {
        setPhoneError(err.message);
      }
    };

    const timer = setTimeout(validatePhone, 600);
    return () => clearTimeout(timer);
  }, [formData.phoneNumber]);

  // Sync referral code from URL if it changes or on mount
  useEffect(() => {
    if (urlRefId) {
      setFormData(prev => ({ ...prev, referralCode: urlRefId }));
    }
  }, [urlRefId]);

  // Look up inviter name for better UX
  useEffect(() => {
    const fetchInviter = async () => {
      const code = formData.referralCode.trim();
      if (!code) {
        setInviterName(null);
        return;
      }

      try {
        // Try direct ID lookup first
        const directDoc = await getDoc(doc(db, 'users', code));
        if (directDoc.exists()) {
          setInviterName(directDoc.data().username);
          return;
        }

        // Try username lookup (case-insensitive)
        const normalized = code.toLowerCase();
        const q = query(collection(db, 'users'), where("username_lowercase", "==", normalized), limit(1));
        const snap = await getDocs(q);
        if (!snap.empty) {
          setInviterName(snap.docs[0].data().username);
        } else {
          setInviterName(null);
        }
      } catch (err) {
        console.error("Error fetching inviter:", err);
      }
    };

    const timer = setTimeout(fetchInviter, 500);
    return () => clearTimeout(timer);
  }, [formData.referralCode]);

  const getFriendlyError = (code: string) => {
    switch (code) {
      case 'auth/email-already-in-use':
        return 'This email is already registered. Try logging in instead.';
      case 'auth/weak-password':
        return 'Your password is too weak. Please use at least 6 characters.';
      case 'auth/network-request-failed':
        return 'Network error. Please check your connection and try again.';
      case 'auth/too-many-requests':
        return 'Too many attempts. Please try again later.';
      case 'username-taken':
        return 'This username is already taken. Please pick another or one of our suggestions.';
      case 'payment-failed':
        return 'Payment failed. Please try again or use a different M-Pesa number.';
      default:
        return 'Registration failed. Please check your details and try again.';
    }
  };

  /** User-friendly message for M-Pesa/STK errors so this never feels like "random failure". */
  const getPaymentErrorMessage = (message: string): string => {
    const m = (message || "").toLowerCase();
    if (m.includes("cannot be reached") || m.includes("user cannot be reached") || m.includes("ds timeout") || m.includes("request cancelled"))
      return "Your phone didn't receive the payment request. Check that your phone is on, has signal, and you're using the number registered with M-Pesa. Wait a moment, then try again.";
    if (m.includes("already in progress"))
      return "A payment is already in progress for this number. Complete it on your phone or wait 3 minutes before trying again.";
    if (m.includes("invalid") && m.includes("phone"))
      return "Use the M-Pesa registered number in format 2547XXXXXXXX.";
    return message || "Payment could not be started. Please try again.";
  };

  const generateSuggestions = (base: string) => {
    const s1 = `${base}${Math.floor(Math.random() * 999)}`;
    const s2 = `${base}_${Math.floor(Math.random() * 99)}`;
    return [s1, s2];
  };

  const checkUsername = async (name: string) => {
    if (!name || name.trim().length < 3) {
      setUsernameStatus('idle');
      return;
    }
    setIsCheckingUsername(true);
    try {
      const normalized = name.trim().toLowerCase();
      const q = query(collection(db, 'users'), where("username_lowercase", "==", normalized), limit(1));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        setUsernameStatus('taken');
        setUsernameSuggestions(generateSuggestions(name.trim()));
      } else {
        setUsernameStatus('available');
        setUsernameSuggestions([]);
      }
    } catch (err) {
      console.error("Error checking username:", err);
    } finally {
      setIsCheckingUsername(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.username) checkUsername(formData.username);
    }, 600);
    return () => clearTimeout(timer);
  }, [formData.username]);


  const handleNextStep = async (e: React.FormEvent) => {
    e.preventDefault();

    if (usernameStatus === 'taken') {
      toast.error(getFriendlyError('username-taken'));
      return;
    }
    // Email validation
    if (emailStatus === 'taken') {
      toast.error('This email is already registered. Please use a different email or login.');
      return;
    }

    // Phone validation
    if (phoneStatus === 'taken') {
      toast.error('This phone number is already registered. Please use a different M-Pesa number or login.');
      return;
    }
    // Check if still checking
    if (isCheckingEmail || isCheckingPhone || isCheckingUsername) {
      toast.error('Please wait while we validate your information...');
      return;
    }


    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    if (!acceptedTerms) {
      toast.error('You must accept the Terms and Conditions');
      return;
    }

    try {
      // Format phone number to exact M-Pesa required format
      const formattedPhone = formatPhoneNumberForMpesa(formData.phoneNumber);

      // Validate it's a Safaricom number
      if (!isValidSafaricomNumber(formattedPhone)) {
        toast.error('Please enter a valid Safaricom M-Pesa number (e.g., 07XX or 2547XX)');
        return;
      }

      setFormData(prev => ({ ...prev, phoneNumber: formattedPhone }));
      setStep(2);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const formatPhoneNumberForMpesa = (phone: string): string => {
    let cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('0')) {
      cleaned = '254' + cleaned.substring(1);
    }
    else if (cleaned.startsWith('7')) {
      cleaned = '254' + cleaned;
    }

    else if (cleaned.startsWith('254')) {
      // Already correct format
    }
    else if (phone.includes('+254')) {
      cleaned = phone.replace('+', '');
    }

    if (!cleaned.startsWith('254') || cleaned.length !== 12) {
      throw new Error('Invalid phone number format. (07XXXXXXXX or 2547XXXXXXXX)');
    }

    return cleaned;
  };

  const isValidSafaricomNumber = (phone: string): boolean => {
    const safaricomPrefixes = ['2547', '2541'];
    return safaricomPrefixes.some(prefix => phone.startsWith(prefix)) && phone.length === 12;
  };

  const cleanupStk = useCallback(() => {
    if (stkCleanedUpRef.current) return;
    stkCleanedUpRef.current = true;

    if (stkTimeoutRef.current) {
      clearTimeout(stkTimeoutRef.current);
      stkTimeoutRef.current = null;
    }

    if (stkUnsubscribeRef.current) {
      stkUnsubscribeRef.current();
      stkUnsubscribeRef.current = null;
    }
  }, []);

  const cleanupPendingDocs = useCallback(async (pendingId: string | null) => {
    if (!pendingId) return;
    try {
      await deleteDoc(doc(db, "pending_payments", pendingId));
      await deleteDoc(doc(db, "pending_registrations", pendingId));
    } catch (_err) {}
  }, []);

  const finalizeAccountAndRedirect = useCallback(async (pendingId: string | null) => {
    if (hasFinalizedRegistrationRef.current) return;
    hasFinalizedRegistrationRef.current = true;

    try {
      // Never create an account without verified payment — under no circumstance
      if (pendingId) {
        const paymentSnap = await getDoc(doc(db, "pending_payments", pendingId));
        if (!paymentSnap.exists() || (paymentSnap.data() as any)?.status !== "COMPLETED") {
          toast.error("Payment was not confirmed. Account cannot be created without successful payment.");
          hasFinalizedRegistrationRef.current = false;
          return;
        }
      }

      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email.trim().toLowerCase(),
        formData.password
      );

      const uid = userCredential.user?.uid;
      if (!uid) {
        throw new Error("Failed to create user account. Please try logging in.");
      }

      // Resolve referrer UID (optional)
      let referrerUid: string | null = null;
      const code = formData.referralCode?.trim();
      if (code) {
        try {
          // Try direct ID lookup first
          const directDoc = await getDoc(doc(db, 'users', code));
          if (directDoc.exists()) {
            referrerUid = directDoc.id;
          } else {
            // Try username lookup (case-insensitive)
            const normalizedRef = code.toLowerCase();
            const q = query(
              collection(db, 'users'),
              where("username_lowercase", "==", normalizedRef),
              limit(1)
            );
            const snap = await getDocs(q);
            if (!snap.empty) {
              referrerUid = snap.docs[0].id;
            }
          }
        } catch (_err) {}
      }

      const now = Date.now();
      const normalizedEmail = formData.email.trim().toLowerCase();

      // Chief role is set in Firestore (config/settings.chiefEmails); new signups are 'user' here
      const activationAmount = ENTRY_FEE;

      // Create main user document
      await setDoc(doc(db, 'users', uid), {
        username: formData.username.trim(),
        username_lowercase: formData.username.trim().toLowerCase(),
        email: normalizedEmail,
        phoneNumber: formData.phoneNumber,
        referredBy: referrerUid || null,
        balance: 0,
        totalEarnings: 0,
        totalWithdrawn: 0,
        createdAt: now,
        lastLoginAt: now,
        activationPaid: true,
        activationAmount,
        role: 'user',
        emailNotificationsEnabled: true,
      });

      // Record activation transaction in user ledger
      await addDoc(collection(db, 'transactions'), {
        userId: uid,
        amount: -activationAmount,
        type: 'ACTIVATION',
        description: 'Account Activation Fee Paid',
        timestamp: now,
      });

      // Handle referral bonuses
      if (referrerUid) {
        const l1Ref = doc(db, 'users', referrerUid);
        const l1Snap = await getDoc(l1Ref);

        if (l1Snap.exists()) {
          await updateDoc(l1Ref, {
            balance: increment(REFERRAL_BONUS_L1),
            totalEarnings: increment(REFERRAL_BONUS_L1),
          });

          await addDoc(collection(db, 'transactions'), {
            userId: referrerUid,
            amount: REFERRAL_BONUS_L1,
            type: 'REFERRAL_BONUS',
            description: `Referral bonus from ${formData.username} (L1)`,
            timestamp: now,
          });

          const l1Data: any = l1Snap.data();
          const l2Id = l1Data?.referredBy;

          if (l2Id) {
            const l2Ref = doc(db, 'users', l2Id);
            const l2Snap = await getDoc(l2Ref);
            if (l2Snap.exists()) {
              await updateDoc(l2Ref, {
                balance: increment(REFERRAL_BONUS_L2),
                totalEarnings: increment(REFERRAL_BONUS_L2),
              });

              await addDoc(collection(db, 'transactions'), {
                userId: l2Id,
                amount: REFERRAL_BONUS_L2,
                type: 'REFERRAL_BONUS',
                description: `Indirect referral bonus from ${formData.username} (L2)`,
                timestamp: now,
              });
            }
          }
        }
      }

      toast.success("Account created! Redirecting to your dashboard...");
      await cleanupPendingDocs(pendingId);
      try {
        const sendNotification = httpsCallable(getFunctions(), "sendActivityNotification");
        await sendNotification({
          type: "account_created",
          email: normalizedEmail,
          username: formData.username.trim(),
        });
      } catch (_err) {}
      navigate("/dashboard");
    } catch (err: any) {
      toast.error(getFriendlyError(err.code || 'payment-failed'));
      await cleanupPendingDocs(pendingId);
      navigate("/login");
    }
  }, [
    ENTRY_FEE,
    REFERRAL_BONUS_L1,
    REFERRAL_BONUS_L2,
    formData.email,
    formData.password,
    formData.username,
    formData.phoneNumber,
    formData.referralCode,
    navigate,
    toast,
    cleanupPendingDocs,
  ]);

  // Ensure we never update state from STK listeners after unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      cleanupStk();
    };
  }, [cleanupStk]);

  const handleStkPush = async () => {
    if (!formData.phoneNumber) {
      toast.error("Enter your M-Pesa number");
      return;
    }

    const phoneRegex = /^2547\d{8}$/;
    if (!phoneRegex.test(formData.phoneNumber)) {
      toast.error("Invalid phone number format (2547XXXXXXXX)");
      return;
    }

    setIsSubmitting(true);
    stkCleanedUpRef.current = false;

    try {
      const pendingRegRef = doc(collection(db, "pending_registrations"));
      const pendingId = pendingRegRef.id;

      await setDoc(pendingRegRef, {
        username: formData.username,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        referralCode: formData.referralCode || null,
        createdAt: Date.now(),
        status: "pending",
      });

      setPendingRegId(pendingId);
      setPaymentStatus("PENDING");

      const payload = {
        phoneNumber: formData.phoneNumber,
        amount: ENTRY_FEE,
        pendingRegId: pendingId,
      };

      const response = await fetch(
        "https://us-central1-valuehubagenciesltd-8da45.cloudfunctions.net/startStkPushHttp",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.success) {
        throw new Error(
          data?.error ||
            data?.responseDescription ||
            `STK push failed (${response.status})`
        );
      }

      toast.info(
        "STK Push sent. Please check your phone and enter your PIN."
      );

      stkUnsubscribeRef.current = onSnapshot(
        doc(db, "pending_payments", pendingId),
        (snap) => {
          if (!isMountedRef.current) return;
          if (!snap.exists()) return;

          const payment = snap.data();

          if (payment.status === "COMPLETED") {
            if (!isMountedRef.current) return;

            toast.success("Payment confirmed! Creating your account...");
            setPaymentStatus("SUCCESS");

            cleanupStk();

            finalizeAccountAndRedirect(pendingId);
          }

          if (payment.status === "FAILED") {
            if (!isMountedRef.current) return;

            const reason = payment.failureReason || "Payment was not completed. Please try again.";
            setLastFailureReason(reason);
            toast.error(reason);
            setPaymentStatus("FAILED");

            cleanupStk();
            cleanupPendingDocs(pendingId);
          }
        }
      );

      stkTimeoutRef.current = setTimeout(async () => {
        if (!isMountedRef.current) return;

        const timeoutMsg = "Payment timed out. No response from M-Pesa. Please try again.";
        setLastFailureReason(timeoutMsg);
        toast.warning(timeoutMsg);

        setPaymentStatus("FAILED");

        try {
          await deleteDoc(doc(db, "pending_payments", pendingId));
          await deleteDoc(doc(db, "pending_registrations", pendingId));
        } catch (_err) {}

        cleanupStk();
      }, 180000); // 3 minutes
    } catch (err: any) {
      const msg = err?.message || "Failed to initiate M-Pesa payment. Please try again.";
      toast.error(getPaymentErrorMessage(msg));
      setPaymentStatus("IDLE");
      setPendingRegId(null);
      await cleanupPendingDocs(pendingId);
      cleanupStk();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetry = async () => {
    if (pendingRegId) {
      await cleanupPendingDocs(pendingRegId);
      setPendingRegId(null);
    }
    setLastFailureReason(null);
    setPaymentStatus('IDLE');
  };

  const selectSuggestion = (s: string) => {
    setFormData({ ...formData, username: s });
    setUsernameStatus('available');
    setUsernameSuggestions([]);
  };

  const handleBackToEdit = () => {
    setStep(1);
    setLastFailureReason(null);
    setPaymentStatus('IDLE');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 lg:p-8 bg-gradient-to-br from-emerald-50 to-teal-50">
      <div className="max-w-2xl w-full bg-white/80 backdrop-blur-lg rounded-[2.5rem] overflow-hidden shadow-2xl shadow-emerald-900/20 border border-white/50 animate-slide-up">

        {/* Progress Header */}
        <div className="p-8 lg:p-12 pb-0">
          <div className="flex items-center justify-between mb-8">
            <Link to="/login" className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:text-emerald-600 hover:border-emerald-600 transition-all bg-white">
              <i className="fas fa-chevron-left"></i>
            </Link>
            <div className="flex space-x-2">
              <div className={`h-2 rounded-full transition-all duration-500 ${step === 1 ? 'w-12 bg-emerald-600' : 'w-4 bg-emerald-200'}`}></div>
              <div className={`h-2 rounded-full transition-all duration-500 ${step === 2 ? 'w-12 bg-emerald-600' : 'w-4 bg-emerald-200'}`}></div>
            </div>
            <div className="w-10"></div>
          </div>

          <div className="text-center mb-10">
            <h2 className="text-4xl font-black text-slate-900 mb-2">
              {step === 1 ? 'Start Your Journey' : 'Final Step'}
            </h2>
            <p className="text-slate-500 font-medium">
              {step === 1 ? 'Join the community and start earning.' : 'Secure your premium account activation.'}
            </p>
          </div>
        </div>

        <div className="p-8 lg:p-12 pt-0">
          {step === 1 ? (
            <form className="grid grid-cols-1 md:grid-cols-2 gap-5" onSubmit={handleNextStep}>
              {/* Username Field */}
              <div className="space-y-1.5 relative md:col-span-2 lg:col-span-1">
                <div className="flex justify-between items-center ml-1">
                  <label className="text-sm font-bold text-slate-700">Username</label>
                  {isCheckingUsername && <i className="fas fa-circle-notch fa-spin text-emerald-500 text-xs"></i>}
                  {usernameStatus === 'available' && <span className="text-emerald-600 text-[10px] font-black uppercase tracking-widest">Available ✓</span>}
                  {usernameStatus === 'taken' && <span className="text-red-500 text-[10px] font-black uppercase tracking-widest">Taken ✗</span>}
                </div>
                <input
                  type="text"
                  required
                  className={`w-full px-4 py-3.5 bg-white border rounded-2xl focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all font-medium text-slate-900 placeholder-slate-400 ${usernameStatus === 'taken' ? 'border-red-300' :
                    usernameStatus === 'available' ? 'border-emerald-300' :
                      'border-slate-200'
                    }`}
                  placeholder="CoolEarner254"
                  value={formData.username}
                  onChange={e => setFormData({ ...formData, username: e.target.value })}
                />

                {usernameStatus === 'taken' && usernameSuggestions.length > 0 && (
                  <div className="col-span-full mt-2 animate-slide-up">
                    <p className="text-xs text-slate-500 font-bold mb-2 ml-1">Try one of these:</p>
                    <div className="flex flex-wrap gap-2">
                      {usernameSuggestions.map(s => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => selectSuggestion(s)}
                          className="px-3 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-black rounded-lg border border-emerald-100 hover:bg-emerald-100 transition-colors"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* M-Pesa Number Field */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center ml-1">
                  <label className="text-sm font-bold text-slate-700 flex items-center">
                    <i className="fas fa-mobile-alt mr-2 text-emerald-600"></i>
                    M-Pesa Number
                  </label>
                  {isCheckingPhone && <i className="fas fa-circle-notch fa-spin text-emerald-500 text-xs"></i>}
                  {phoneStatus === 'available' && <span className="text-emerald-600 text-[10px] font-black uppercase tracking-widest">Available ✓</span>}
                  {phoneStatus === 'taken' && <span className="text-red-500 text-[10px] font-black uppercase tracking-widest">Already Registered ✗</span>}
                </div>
                <input
                  type="tel"
                  required
                  placeholder="0712345678 or 254712345678"
                  className={`w-full px-4 py-3.5 bg-white border rounded-2xl focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all font-medium text-slate-900 placeholder-slate-400 ${phoneStatus === 'taken' || phoneError ? 'border-red-300' :
                    phoneStatus === 'available' ? 'border-emerald-300' :
                      'border-slate-200'
                    }`}
                  value={formData.phoneNumber}
                  onChange={e => setFormData({ ...formData, phoneNumber: e.target.value })}
                />
                {phoneError && (
                  <p className="text-red-500 text-xs font-medium mt-1 ml-1">
                    <i className="fas fa-exclamation-circle mr-1"></i>
                    {phoneError}
                  </p>
                )}
              </div>

              {/* Email Field */}
              <div className="col-span-full space-y-1.5">
                <div className="flex justify-between items-center ml-1">
                  <label className="text-sm font-bold text-slate-700">Email Address</label>
                  {isCheckingEmail && <i className="fas fa-circle-notch fa-spin text-emerald-500 text-xs"></i>}
                  {emailStatus === 'available' && <span className="text-emerald-600 text-[10px] font-black uppercase tracking-widest">Available ✓</span>}
                  {emailStatus === 'taken' && <span className="text-red-500 text-[10px] font-black uppercase tracking-widest">Already Registered ✗, Login Instead</span>}
                </div>
                <input
                  type="email"
                  required
                  className={`w-full px-4 py-3.5 bg-white border rounded-2xl focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all font-medium text-slate-900 placeholder-slate-400 ${emailStatus === 'taken' ? 'border-red-300' :
                    emailStatus === 'available' ? 'border-emerald-300' :
                      'border-slate-200'
                    }`}
                  placeholder="name@provider.com"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              {/* Password Fields */}
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-700 ml-1">Password</label>
                <input
                  type="password"
                  required
                  className="w-full px-4 py-3.5 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-medium text-slate-900 placeholder-slate-400"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-700 ml-1">Confirm Password</label>
                <input
                  type="password"
                  required
                  className="w-full px-4 py-3.5 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-medium text-slate-900 placeholder-slate-400"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                />
              </div>

              {/* Referral Code Field */}
              <div className="col-span-full space-y-1.5">
                <div className="flex justify-between items-center ml-1">
                  <label className="text-sm font-bold text-slate-700">Referral Code (Optional)</label>
                  {inviterName && (
                    <span className="text-emerald-600 text-[10px] font-black uppercase tracking-widest animate-pulse">
                      <i className="fas fa-user-check mr-1"></i> Invited by {inviterName}
                    </span>
                  )}
                </div>
                <div className="relative">
                  <input
                    type="text"
                    className={`w-full pl-10 pr-4 py-3.5 border rounded-2xl focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all font-bold placeholder-emerald-300 bg-white ${inviterName ? 'border-emerald-200 text-emerald-800' : 'border-slate-200 text-slate-900'
                      }`}
                    placeholder="Enter referrer ID or username"
                    value={formData.referralCode}
                    onChange={e => setFormData({ ...formData, referralCode: e.target.value })}
                  />
                  <div className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none ${inviterName ? 'text-emerald-600' : 'text-slate-400'
                    }`}>
                    <i className="fas fa-gift"></i>
                  </div>
                </div>
              </div>

              {/* Terms Checkbox */}
              <div className="col-span-full py-2">
                <label className="flex items-center space-x-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    required
                    className="w-6 h-6 rounded-lg border-slate-300 text-emerald-600 focus:ring-emerald-500 transition-all cursor-pointer"
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                  />
                  <span className="text-sm font-semibold text-slate-600">
                    I agree to the <Link to="/terms" className="text-emerald-600 font-black hover:underline">Terms</Link> and <Link to="/privacy" className="text-emerald-600 font-black hover:underline">Privacy Policy</Link>
                  </span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isCheckingUsername || usernameStatus === 'taken' ||
                  isCheckingEmail || emailStatus === 'taken' ||
                  isCheckingPhone || phoneStatus === 'taken' ||
                  !!phoneError || isSubmitting}
                className="col-span-full py-4 px-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black shadow-xl shadow-emerald-200 transition-all active:scale-95 mt-4 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>Continue to Activation</span>
                <i className="fas fa-arrow-right"></i>
              </button>
            </form>
          ) : (
            <div className="text-center animate-slide-up bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
              {/* Payment Amount Card */}
              <div className="max-w-xs mx-auto mb-10 p-8 rounded-[2rem] bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-2xl shadow-emerald-200">
                <span className="text-xs font-black uppercase tracking-widest opacity-80 mb-2 block">Premium Activation</span>
                <div className="text-5xl font-black mb-2 tracking-tighter">
                  Ksh {ENTRY_FEE}
                </div>
                <p className="text-emerald-50 text-xs font-bold">One-time payment for lifetime access</p>
              </div>

              {/* Payment Status Views */}
              {paymentStatus === 'IDLE' && (
                <div className="space-y-6">
                  <p className="text-slate-600 font-medium">
                    We'll send an STK Push to <strong className="text-slate-900">{formData.phoneNumber}</strong>. <br />
                    Please have your phone ready to enter your M-Pesa PIN.
                  </p>
                  <button
                    onClick={handleStkPush}
                    disabled={isSubmitting}
                    className="w-full py-5 px-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black shadow-xl shadow-emerald-200 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    {isSubmitting ? (
                      <>
                        <i className="fas fa-circle-notch fa-spin"></i>
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <i className="fas fa-mobile-alt"></i>
                        <span>Pay with M-Pesa</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleBackToEdit}
                    className="text-slate-400 font-bold hover:text-slate-600 transition-colors"
                  >
                    Back to edit details
                  </button>
                </div>
              )}

              {paymentStatus === 'PENDING' && (
                <div className="py-12 flex flex-col items-center">
                  <div className="relative mb-8">
                    <div className="w-24 h-24 border-8 border-emerald-50 border-t-emerald-600 rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <i className="fas fa-mobile-alt text-emerald-600 text-2xl"></i>
                    </div>
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 mb-2">Awaiting Payment</h3>
                  <p className="text-slate-500 font-medium mb-4">Check your phone and enter your M-Pesa PIN</p>
                  <p className="text-sm text-slate-400">This page will update automatically once payment is confirmed</p>

                  <button
                    onClick={handleRetry}
                    className="mt-8 text-emerald-600 font-bold hover:text-emerald-700 transition-colors"
                  >
                    <i className="fas fa-redo-alt mr-2"></i>
                    Try again if payment fails
                  </button>
                </div>
              )}

              {paymentStatus === 'FAILED' && (
                <div className="py-12 flex flex-col items-center">
                  <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mb-6">
                    <i className="fas fa-times-circle text-4xl text-red-500"></i>
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 mb-2">Payment Failed</h3>
                  <p className="text-slate-500 font-medium mb-6 text-center">
                    {lastFailureReason || "We couldn't process your payment."}
                  </p>
                  <div className="space-y-4 w-full">
                    <button
                      onClick={handleRetry}
                      className="w-full py-4 px-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black shadow-lg transition-all active:scale-95"
                    >
                      Try Again
                    </button>

                    <button
                      onClick={handleBackToEdit}
                      className="w-full py-4 px-6 border border-slate-200 text-slate-600 rounded-2xl font-black hover:bg-slate-50 transition-all"
                    >
                      Back to Details
                    </button>
                  </div>
                </div>
              )}

              {paymentStatus === 'SUCCESS' && (
                <div className="py-12 flex flex-col items-center">
                  <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center mb-6 scale-110 shadow-lg shadow-emerald-100 animate-bounce">
                    <i className="fas fa-check text-4xl text-emerald-600"></i>
                  </div>
                  <h3 className="text-3xl font-black text-slate-900 mb-2">Welcome to Valuehub!</h3>
                  <p className="text-slate-500 font-medium animate-pulse mb-4">Payment confirmed! Creating your account...</p>
                  <div className="w-48 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-600 rounded-full animate-progress"></div>
                  </div>
              <p className="text-sm text-slate-400 mt-6">Redirecting you to your dashboard...</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Register;