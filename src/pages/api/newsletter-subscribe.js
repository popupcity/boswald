export async function POST({ request }) {
  try {
    const body = await request.json();
    const { email, language } = body;

    console.log(
      `Processing request for email: ${email}, language: ${language}`
    );

    if (!email || !language) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'missing_parameters',
          message: 'E-mailadres of taal ontbreekt.',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Hard-coded values
    const apiKey = '96U7CnteXpG9Bvi6Cn4g';
    const originalSendyUrl = 'https://newsletter.popupcity.net/subscribe';
    // Use a CORS proxy
    const sendyUrl = `https://corsproxy.io/?${encodeURIComponent(
      originalSendyUrl
    )}`;

    // Choose appropriate list ID
    let listId;
    if (language === 'nl') {
      listId = '31YdPQSL7hZZBZBaR763EULA';
    } else if (language === 'en') {
      listId = 'MtTwkoWw0HCcaCvSFoIvUg';
    } else {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'invalid_language',
          message: 'Taal niet herkend.',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const data = new URLSearchParams();
    data.append('api_key', apiKey);
    data.append('list', listId);
    data.append('email', email);
    data.append('boolean', 'true');

    console.log(`Sending request via CORS proxy to Sendy for: ${email}`);

    const response = await fetch(sendyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: data.toString(),
    });

    const responseStatus = response.status;
    const responseText = await response.text();

    console.log(
      `Proxy response - Status: ${responseStatus}, Response: ${responseText}`
    );

    // Process the response
    if (responseText === '1' || responseText.toLowerCase() === 'true') {
      return new Response(
        JSON.stringify({ success: true, message: 'Succesvol ingeschreven.' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    } else if (responseText.includes('Already subscribed')) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'already_subscribed',
          message: 'Al ingeschreven',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    } else if (responseText.includes('Invalid email')) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'invalid_email',
          message: 'Ongeldige email',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    } else {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'api_error',
          message: responseText,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error('Server error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'server_error',
        message: error.message,
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
