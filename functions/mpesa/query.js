// functions/mpesa/query.js
const axios = require("axios");
const { getAccessToken } = require("./oauth");

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

async function queryStkStatus(checkoutRequestId, config) {
  const accessToken = await getAccessToken(config);
  const timestamp = generateTimestamp();

  const password = Buffer.from(
    `${config.mpesa.shortcode}${config.mpesa.passkey}${timestamp}`
  ).toString("base64");

  const payload = {
    BusinessShortCode: config.mpesa.shortcode,
    Password: password,
    Timestamp: timestamp,
    CheckoutRequestID: checkoutRequestId,
  };

  const res = await axios.post(
    "https://api.safaricom.co.ke/mpesa/stkpushquery/v1/query",
    payload,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      timeout: 15000,
    }
  );

  return res.data;
}

module.exports = { queryStkStatus };