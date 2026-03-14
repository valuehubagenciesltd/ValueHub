// functions/mpesa/oauth.js
const axios = require("axios");

/**
 * getAccessToken(config)
 * Expects a functions.config() object with mpesa.consumer_key and mpesa.consumer_secret
 */
async function getAccessToken(config) {
  const consumerKey = config?.mpesa?.consumer_key;
  const consumerSecret = config?.mpesa?.consumer_secret;

  if (!consumerKey || !consumerSecret) {
    throw new Error("M-Pesa consumer key/secret not configured");
  }

  const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64");

  try {
    const response = await axios.get(
      "https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
      {
        headers: {
          Authorization: `Basic ${auth}`,
        },
        timeout: 10000,
      }
    );

    if (!response?.data?.access_token) {
      throw new Error("No access token in OAuth response");
    }

    return response.data.access_token;
  } catch (error) {
    throw new Error("Failed to authenticate with Safaricom OAuth");
  }
}

module.exports = { getAccessToken };