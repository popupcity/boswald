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

    const apiKey = import.meta.env.SENDY_API_KEY;
    const sendyUrl = import.meta.env.SENDY_SUBSCRIBE_URL;

    // Kies juiste lijst-ID
    let listId;
    if (language === 'nl') {
      listId = import.meta.env.SENDY_LIST_ID_NL;
    } else if (language === 'en') {
      listId = import.meta.env.SENDY_LIST_ID_EN;
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

    const response = await fetch(sendyUrl, {
      method: 'POST',
      body: data,
    });

    const responseText = await response.text();
    console.log('Sendy API response:', responseText);

    if (
      responseText.includes('1') ||
      responseText.toLowerCase().includes('true')
    ) {
      return new Response(
        JSON.stringify({ success: true, message: 'Succesvol ingeschreven' }),
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
