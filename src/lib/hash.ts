export async function hashPin(pin: string): Promise<string> {
  const bytes = new TextEncoder().encode(`hanzi-buddy:${pin}`); // pre-rename salt; kept so existing PINs still work
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
}
