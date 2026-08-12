function randomBytes(size) {
  const output = new Uint8Array(size);
  // Web Crypto limits each getRandomValues call to 65,536 bytes.
  for (let offset = 0; offset < size; offset += 65_536) {
    crypto.getRandomValues(output.subarray(offset, Math.min(offset + 65_536, size)));
  }
  return output;
}

export async function onRequestGet({ request }) {
  const url = new URL(request.url);
  const requested = Number(url.searchParams.get('bytes')) || 262_144;
  const bytes = Math.min(Math.max(requested, 65_536), 1_000_000);
  return new Response(randomBytes(bytes), {
    headers: {
      'Content-Type': 'application/octet-stream',
      'Content-Length': String(bytes),
      'Cache-Control': 'no-store, no-cache, must-revalidate, private',
      'Content-Encoding': 'identity'
    }
  });
}
