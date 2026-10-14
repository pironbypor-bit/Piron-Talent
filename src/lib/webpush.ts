// Web Push without a library: RFC 8291 payload encryption (aes128gcm) and RFC 8292 VAPID, on WebCrypto, so it
// runs the same on Cloudflare Workers and in Node for the test (scratchpad webpush-test.mjs checks the RFC vectors).

type Bytes = Uint8Array<ArrayBuffer>;
export type PushSubscriptionKeys = { endpoint: string; p256dh: string; auth: string };

const te = new TextEncoder();
export const b64url = (b: ArrayBuffer | Uint8Array) => btoa(String.fromCharCode(...new Uint8Array(b))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
export const fromB64url = (s: string): Bytes => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(s.length / 4) * 4, "=")), (c) => c.charCodeAt(0));
const concat = (...parts: Bytes[]) => {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let o = 0;
  for (const p of parts) { out.set(p, o); o += p.length; }
  return out;
};
const hkdf = async (salt: Bytes, ikm: Bytes, info: Bytes, bits: number) => {
  const key = await crypto.subtle.importKey("raw", ikm, "HKDF", false, ["deriveBits"]);
  return new Uint8Array(await crypto.subtle.deriveBits({ name: "HKDF", hash: "SHA-256", salt, info }, key, bits));
};

/** Test hooks: a fixed sender key pair and salt reproduce the RFC 8291 example byte for byte. */
export type EncryptOptions = { asKeyPair?: CryptoKeyPair; salt?: Bytes };

export async function encryptPayload(plaintext: string, sub: PushSubscriptionKeys, opts: EncryptOptions = {}): Promise<Bytes> {
  const uaPublic = fromB64url(sub.p256dh);
  const authSecret = fromB64url(sub.auth);
  const as = opts.asKeyPair ?? (await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"]));
  const asPublic = new Uint8Array(await crypto.subtle.exportKey("raw", as.publicKey));
  const uaKey = await crypto.subtle.importKey("raw", uaPublic, { name: "ECDH", namedCurve: "P-256" }, false, []);
  const ecdh = new Uint8Array(await crypto.subtle.deriveBits({ name: "ECDH", public: uaKey }, as.privateKey, 256));
  const ikm = await hkdf(authSecret, ecdh, concat(te.encode("WebPush: info\0"), uaPublic, asPublic), 256);
  const salt = opts.salt ?? crypto.getRandomValues(new Uint8Array(16));
  const cek = await hkdf(salt, ikm, te.encode("Content-Encoding: aes128gcm\0"), 128);
  const nonce = await hkdf(salt, ikm, te.encode("Content-Encoding: nonce\0"), 96);
  const padded = concat(te.encode(plaintext), new Uint8Array([2]));
  const aes = await crypto.subtle.importKey("raw", cek, "AES-GCM", false, ["encrypt"]);
  const cipher = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv: nonce }, aes, padded));
  const header = new Uint8Array(21);
  header.set(salt, 0);
  new DataView(header.buffer).setUint32(16, 4096);
  header[20] = asPublic.length;
  return concat(header, asPublic, cipher);
}

/** VAPID: a short-lived ES256 token for the push service, signed with the private key (JWK with d). */
export async function vapidAuthorization(endpoint: string, publicKeyB64: string, privateJwk: JsonWebKey, subject: string): Promise<string> {
  const aud = new URL(endpoint).origin;
  const enc = (o: unknown) => b64url(te.encode(JSON.stringify(o)));
  const unsigned = `${enc({ typ: "JWT", alg: "ES256" })}.${enc({ aud, exp: Math.floor(Date.now() / 1000) + 12 * 3600, sub: subject })}`;
  const key = await crypto.subtle.importKey("jwk", privateJwk, { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, key, te.encode(unsigned));
  return `vapid t=${unsigned}.${b64url(sig)}, k=${publicKeyB64}`;
}

/** One push. Returns the status: 201 sent, 404/410 the subscription is dead and should be removed. */
export async function sendPush(sub: PushSubscriptionKeys, payload: object, vapid: { publicKey: string; privateJwk: JsonWebKey; subject: string }, ttl = 86400): Promise<number> {
  const body = await encryptPayload(JSON.stringify(payload), sub);
  const res = await fetch(sub.endpoint, {
    method: "POST",
    headers: {
      Authorization: await vapidAuthorization(sub.endpoint, vapid.publicKey, vapid.privateJwk, vapid.subject),
      "Content-Encoding": "aes128gcm",
      "Content-Type": "application/octet-stream",
      TTL: String(ttl),
      Urgency: "normal",
    },
    body,
  });
  return res.status;
}
