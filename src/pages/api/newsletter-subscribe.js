export async function POST({ request }) {
  try {
    // Extract the JSON body from the request
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

    // Let's try multiple approaches and see which one works

    // Approach 1: Using URLSearchParams (original method)
    const data1 = new URLSearchParams();
    data1.append('api_key', apiKey);
    data1.append('list', listId);
    data1.append('email', email);
    data1.append('boolean', 'true');

    console.log('Approach 1 - URLSearchParams:', data1.toString());

    // Approach 2: Using manual string formatting
    const data2 = `api_key=${encodeURIComponent(
      apiKey
    )}&list=${encodeURIComponent(listId)}&email=${encodeURIComponent(
      email
    )}&boolean=true`;

    console.log('Approach 2 - Manual string:', data2);

    // Try both approaches
    console.log('Trying approach 1...');
    let response = await fetch(sendyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: data1.toString(),
    });

    let responseStatus = response.status;
    let responseText = await response.text();

    console.log(
      `Approach 1 result - Status: ${responseStatus}, Response: ${responseText}`
    );

    // If approach 1 fails, try approach 2
    if (responseStatus !== 200 || responseText.includes('Forbidden')) {
      console.log('Approach 1 failed, trying approach 2...');
      response = await fetch(sendyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: data2,
      });

      responseStatus = response.status;
      responseText = await response.text();

      console.log(
        `Approach 2 result - Status: ${responseStatus}, Response: ${responseText}`
      );
    }

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
    } else if (responseText.includes('Forbidden') || responseStatus !== 200) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'http_error',
          message: `HTTP error: ${responseStatus}`,
          details: responseText,
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
