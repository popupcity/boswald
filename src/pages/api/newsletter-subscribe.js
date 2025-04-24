export async function GET() {
  const data = new URLSearchParams();
  data.append('api_key', '96U7CnteXpG9Bvi6Cn4g');
  data.append('list', '31YdPQSL7hZZBZBaR763EULA');
  data.append('email', 'test@example.com');
  data.append('boolean', 'true');

  const response = await fetch('https://newsletter.popupcity.net/subscribe', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: data.toString(),
  });

  const text = await response.text();
  return new Response(text, { status: 200 });
}
