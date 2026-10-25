/**
 * SMS Local Gateway Integration Service
 * Documentation: https://app.smslocal.in/
 */

const SMS_ERROR_CODES: Record<string, string> = {
  '101': 'Invalid user / API key',
  '102': 'Invalid sender ID',
  '103': 'Invalid destination contact(s)',
  '104': 'Invalid SMS route',
  '105': 'Invalid message content',
  '106': 'Message blocked as spam',
  '107': 'Promotional route block',
  '108': 'Low credits in the specified route',
  '109': 'Promotional route works between 9:00 AM and 8:45 PM only',
  '110': 'Invalid DLT Template ID',
  '111': 'No SMSC available',
};

export interface SmsSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Send an OTP message to the specified 10-digit mobile number using SMS Local API
 */
export async function sendOtpSms(mobile: string, otp: string): Promise<SmsSendResult> {
  const apiKey = process.env.SMS_API_KEY;
  const senderId = process.env.SMS_SENDER_ID || 'ALERTS';
  const route = process.env.SMS_ROUTE || '2'; // 2 = OTP route
  const templateId = process.env.SMS_TEMPLATE_ID || '';
  const messageTemplate =
    process.env.SMS_MESSAGE_TEMPLATE ||
    'Your OTP for DraftMate verification is {#var#}. Valid for 5 minutes. Do not share with anyone.';

  // If SMS API key or template ID is not configured or in local development mock mode
  if (
    !apiKey ||
    apiKey === 'YOUR_SMSLOCAL_API_KEY' ||
    !templateId ||
    templateId === 'YOUR_DLT_TEMPLATE_ID'
  ) {
    console.log(`\n======================================================`);
    console.log(`[SMS Gateway Mock] Destination: +91-${mobile}`);
    console.log(`[SMS Gateway Mock] Generated OTP: ${otp}`);
    if (templateId === 'YOUR_DLT_TEMPLATE_ID') {
      console.log(`[SMS Gateway Mock] (Set SMS_TEMPLATE_ID in .env with your approved DLT template to send live SMS)`);
    } else {
      console.log(`[SMS Gateway Mock] (Set SMS_API_KEY in .env to use live SMS gateway)`);
    }
    console.log(`======================================================\n`);
    return { success: true, messageId: 'DEV_MOCK_' + Date.now() };
  }

  // Format message text with OTP
  const message = messageTemplate.replace('{#var#}', otp).replace('{otp}', otp);

  // Build SMS Local API URL
  const queryParams = new URLSearchParams({
    key: apiKey,
    route,
    sender: senderId,
    number: mobile,
    sms: message,
    templateid: templateId,
  });

  const apiUrl = `https://app.smslocal.in/api/smsapi?${queryParams.toString()}`;

  try {
    const response = await fetch(apiUrl, { method: 'GET' });
    const responseText = (await response.text()).trim();

    // Check if the response matches any known SMS Local error code
    if (SMS_ERROR_CODES[responseText]) {
      const errorMessage = `SMS Gateway Error (${responseText}): ${SMS_ERROR_CODES[responseText]}`;
      console.error(`[SMS Service] Failed to send SMS to ${mobile}:`, errorMessage);
      return { success: false, error: errorMessage };
    }

    // A numeric or alphanumeric response that is not an error code indicates success message id
    console.log(`[SMS Service] SMS dispatched successfully to ${mobile}. Message ID: ${responseText}`);
    return { success: true, messageId: responseText };
  } catch (error: any) {
    console.error(`[SMS Service] Network error dispatching SMS:`, error);
    return { success: false, error: error?.message || 'Failed to connect to SMS gateway' };
  }
}

/**
 * Check delivery report of sent message
 */
export async function getDeliveryReport(messageId: string): Promise<any> {
  const apiKey = process.env.SMS_API_KEY;
  if (!apiKey) return { error: 'SMS_API_KEY is not configured' };

  try {
    const url = `https://app.smslocal.in/api/dlrapi?key=${encodeURIComponent(apiKey)}&messageid=${encodeURIComponent(messageId)}`;
    const res = await fetch(url);
    return await res.json();
  } catch (err: any) {
    return { error: err?.message || 'Failed to retrieve delivery report' };
  }
}

/**
 * Check available route credits
 */
export async function checkRouteCredits(route: string = '2'): Promise<any> {
  const apiKey = process.env.SMS_API_KEY;
  if (!apiKey) return { error: 'SMS_API_KEY is not configured' };

  try {
    const url = `https://app.smslocal.in/api/creditapi?key=${encodeURIComponent(apiKey)}&route=${encodeURIComponent(route)}`;
    const res = await fetch(url);
    return await res.json();
  } catch (err: any) {
    return { error: err?.message || 'Failed to check credits' };
  }
}
