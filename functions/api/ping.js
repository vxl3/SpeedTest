export async function onRequestGet() {
  return Response.json(
    { ok: true, serverTime: Date.now() },
    { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, private' } }
  );
}
