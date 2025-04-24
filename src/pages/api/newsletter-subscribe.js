export async function POST({ request }) {
  try {
    // Extract the JSON body from the request
    const body = await request.json();
    const { email, language } = body;

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

    // Hard-coded values since env access is problematic
    const apiKey = '96U7CnteXpG9Bvi6Cn4g';
    const sendyUrl = 'https://newsletter.popupcity.net/subscribe';

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

    console.log(
      `Sending request to Sendy for email: ${email}, language: ${language}, listId: ${listId}`
    );

    const data = new URLSearchParams();
    data.append('api_key', apiKey);
    data.append('list', listId);
    data.append('email', email);
    data.append('boolean', 'true');

    // Add additional headers that might help with the 403 issue
    const response = await fetch(sendyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (compatible; PopupCity/1.0)',
        Origin: 'https://popupcity.net',
        Referer: 'https://popupcity.net/',
      },
      body: data.toString(),
    });

    console.log(`Sendy API response status: ${response.status}`);

    const responseText = await response.text();
    console.log(`Sendy API raw response: ${responseText}`);

    // First check for HTTP status
    if (response.status !== 200) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'http_error',
          message: `HTTP error: ${response.status}`,
          details: responseText,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Then check for Sendy-specific responses
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
