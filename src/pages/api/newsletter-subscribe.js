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

    // For Cloudflare + Astro, access env vars using this special syntax
    const apiKey = '96U7CnteXpG9Bvi6Cn4g';
    const sendyUrl = 'https://newsletter.popupcity.net/subscribe';

    // Log for debugging
    console.log(`Using Sendy URL: ${sendyUrl}`);
    console.log(`Using API Key: ${apiKey?.substring(0, 5)}...`);

    // Voeg een controle toe om ervoor te zorgen dat de URL niet undefined is
    if (!sendyUrl) {
      console.error('Sendy URL is undefined!');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'configuration_error',
          message: 'Server configuration error',
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Kies juiste lijst-ID
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

    console.log(`Using List ID: ${listId}`);
    console.log(`Email to subscribe: ${email}`);

    const data = new URLSearchParams();
    data.append('api_key', apiKey);
    data.append('list', listId);
    data.append('email', email);
    data.append('boolean', 'true');

    console.log('Sending request to Sendy with data:', data.toString());

    const response = await fetch(sendyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: data.toString(),
    });

    const responseText = await response.text();
    console.log('Sendy API response:', responseText);

    // More strict response parsing
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
      console.error('Unexpected Sendy response:', responseText);
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
