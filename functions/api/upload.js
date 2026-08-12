export async function onRequestPost({ request }) {
  const data = await request.arrayBuffer();
  return Response.json(
    { received: data.byteLength },
    { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, private' } }
  );
}

