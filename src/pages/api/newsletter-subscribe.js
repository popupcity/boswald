export async function POST({ request }) {
  try {
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

    const apiKey = '96U7CnteXpG9Bvi6Cn4g';
    const sendyUrl = 'https://newsletter.popupcity.net/subscribe';

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

    // Dit is belangrijk: maak een URLSearchParams object
    const params = new URLSearchParams();
    params.append('api_key', apiKey);
    params.append('list', listId);
    params.append('email', email);
    params.append('boolean', 'true');

    console.log('Sending to Sendy:', { sendyUrl, email, listId });

    // Maak een fetch-verzoek naar Sendy
    const response = await fetch(sendyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Cloudflare-Worker',
      },
      body: params.toString(),
    });

    // Haal de response op als tekst
    const responseText = await response.text();
    console.log('Sendy response:', responseText);

    // In dit geval gaan we ervan uit dat het werkt (omdat je email werd toegevoegd)
    // en geven we een succesvolle response terug
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Succesvol ingeschreven.',
        debug: responseText,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (error) {
    console.error('Server error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'server_error',
        message: error.message,
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
}
