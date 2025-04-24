export async function POST({ request }) {
  try {
    // Extract the JSON body and validate required fields
    const { email, language } = await request.json();

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

    // Get environment variables
    const apiKey = import.meta.env.SENDY_API_KEY ?? process.env.SENDY_API_KEY;
    const sendyUrl =
      import.meta.env.SENDY_SUBSCRIBE_URL ?? process.env.SENDY_SUBSCRIBE_URL;

    if (!sendyUrl || !apiKey) {
      console.error('Sendy configuratie ontbreekt');
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
    const listIdKey = `SENDY_LIST_ID_${language.toUpperCase()}`;
    const listId = import.meta.env[listIdKey] ?? process.env[listIdKey];

    if (!listId) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'invalid_language',
          message: 'Taal niet ondersteund.',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Bereid data voor en verstuur naar Sendy
    const data = new URLSearchParams();
    data.append('api_key', apiKey);
    data.append('list', listId);
    data.append('email', email);
    data.append('boolean', 'true');

    const response = await fetch(sendyUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: data.toString(),
    });

    const responseText = await response.text();

    // Verwerk de response
    if (
      responseText.includes('1') ||
      responseText.toLowerCase().includes('true')
    ) {
      return new Response(
        JSON.stringify({ success: true, message: 'Succesvol ingeschreven.' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Map bekende foutmeldingen
    const errorMap = {
      'Already subscribed': {
        error: 'already_subscribed',
        message: 'Al ingeschreven',
      },
      'Invalid email': { error: 'invalid_email', message: 'Ongeldige email' },
    };

    for (const [errText, errInfo] of Object.entries(errorMap)) {
      if (responseText.includes(errText)) {
        return new Response(
          JSON.stringify({
            success: false,
            ...errInfo,
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    // Onbekende fout
    return new Response(
      JSON.stringify({
        success: false,
        error: 'api_error',
        message: responseText,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Server error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'server_error',
        message: 'Er is een serverfout opgetreden.',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
