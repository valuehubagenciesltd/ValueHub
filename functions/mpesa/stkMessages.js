/**
 * Map M-Pesa STK ResultDesc / ResponseDescription to user-friendly messages
 * shown in the registration payment flow.
 */
function mapStkFailureMessage(desc) {
  if (!desc || typeof desc !== "string") return "Payment failed. Please try again.";
  const d = desc.toLowerCase();

  if (d.includes("cancelled by user") || d.includes("canceled by user") || d.includes("user cancelled") || d.includes("user canceled")) return "You cancelled the payment.";
  if (d.includes("insufficient balance") || d.includes("insufficient funds")) return "Insufficient M-Pesa balance.";
  if (d.includes("invalid pin") || d.includes("wrong pin") || d.includes("incorrect pin")) return "Wrong PIN entered.";
  if (d.includes("ds timeout") || d.includes("cannot be reached") || d.includes("user cannot be reached")) return "Your phone didn't respond. Check signal and try again.";
  if (d.includes("subscriber is not on the network") || d.includes("not on the network")) return "Phone off or out of network. Try again.";
  if (d.includes("request rejected") || d.includes("rejected by user")) return "You rejected the payment request.";
  if (d.includes("stk query error") || d.includes("timed out")) return "Payment timed out. Please try again.";
  if (d.includes("missing metadata") || d.includes("amount mismatch")) return "Payment could not be verified. Please try again.";

  return desc;
}

module.exports = { mapStkFailureMessage };
