export async function GET() {
  const BMC_ACCESS_TOKEN = import.meta.env.BMC_ACCESS_TOKEN;

  // No token configured yet - return placeholder
  if (!BMC_ACCESS_TOKEN) {
    return new Response(JSON.stringify({ total: 0, supporters: 0 }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const res = await fetch('https://developers.buymeacoffee.com/api/v1/supporters', {
      headers: { 'Authorization': `Bearer ${BMC_ACCESS_TOKEN}` }
    });

    if (!res.ok) throw new Error(`BMC API returned ${res.status}`);

    const data = await res.json();
    const supporters = data.data || [];

    // Sum up all donations
    const total = supporters.reduce((sum: number, s: { support_coffee ?: string; support_coffees ?: number }) => {
      const coffees = s.support_coffees || 1;
      return sum + coffees * 5; // each coffee is $5
    }, 0);

    // Cache for 5 minutes
    return new Response(JSON.stringify({ total, supporters: supporters.length }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300'
      }
    });
  } catch (e) {
    return new Response(JSON.stringify({ total: 0, supporters: 0 }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
