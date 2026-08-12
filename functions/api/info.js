export async function onRequestGet({ request }) {
  const ip = request.headers.get('CF-Connecting-IP') || '—';
  const colo = request.cf?.colo || 'Cloudflare Edge';
  return Response.json(
    { ip, server: `Cloudflare Edge · ${colo}` },
    { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, private' } }
  );
}
