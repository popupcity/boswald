//
// /pages/api/newsletter-subscribe.js

export async function POST({ request, platform }) {
  // Voeg evt. 'platform' toe voor env vars
  // --- ALLEREERSTE TEST LOG ---
  console.log(
    `[${new Date().toISOString()}] FUNCTION newsletter-subscribe INVOKED!`
  );
  // --- EINDE TEST LOG ---

  try {
    // Log toegang tot env vars (Cloudflare manier)
    // Gebruik platform.env als je de adapter correct hebt ingesteld
    const apiKey =
      platform?.env?.SENDY_API_KEY || import.meta.env.SENDY_API_KEY;
    console.log('API Key loaded:', !!apiKey); // Logt true of false

    console.log('Attempting to parse request body...');
    const body = await request.json();
    console.log('Request body parsed:', body);
    const { email, language } = body;

    // ... (rest van je bestaande code binnen de try block) ...

    console.log('Preparing to call Sendy API...');
    const response = await fetch(sendyUrl, {
      /* ... */
    });
    const responseText = await response.text();
    // DIT IS DE BELANGRIJKE LOG
    console.log('Sendy API response raw text:', responseText);

    // ... (rest van je response handling) ...
  } catch (error) {
    // --- BELANGRIJKE ERROR LOG ---
    console.error(
      `[${new Date().toISOString()}] !!! FUNCTION ERROR !!!`,
      error.message,
      error.stack
    );
    // --- EINDE ERROR LOG ---
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
