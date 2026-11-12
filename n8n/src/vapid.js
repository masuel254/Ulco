// Signature VAPID (JWT ES256) en JavaScript pur, sans module ni crypto du serveur.
// SHA-256, HMAC, ECDSA P-256 avec nonce déterministe RFC 6979 (pas besoin d'aléa).
// Utilisé tel quel dans le nœud Code "Signer VAPID" du workflow n8n.

function sha256(bytes) {
  const K = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
  ];
  const H = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
  const len = bytes.length;
  const total = Math.ceil((len + 9) / 64) * 64;
  const m = new Uint8Array(total);
  m.set(bytes);
  m[len] = 0x80;
  const bits = len * 8;
  m[total - 4] = (bits >>> 24) & 255; m[total - 3] = (bits >>> 16) & 255;
  m[total - 2] = (bits >>> 8) & 255; m[total - 1] = bits & 255;
  m[total - 5] = Math.floor(bits / 4294967296) & 255;
  const w = new Array(64);
  const rot = (x, n) => (x >>> n) | (x << (32 - n));
  for (let o = 0; o < total; o += 64) {
    for (let i = 0; i < 16; i++) w[i] = (m[o + 4 * i] << 24) | (m[o + 4 * i + 1] << 16) | (m[o + 4 * i + 2] << 8) | m[o + 4 * i + 3];
    for (let i = 16; i < 64; i++) {
      const s0 = rot(w[i - 15], 7) ^ rot(w[i - 15], 18) ^ (w[i - 15] >>> 3);
      const s1 = rot(w[i - 2], 17) ^ rot(w[i - 2], 19) ^ (w[i - 2] >>> 10);
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) | 0;
    }
    let [a, b, c, d, e, f, g, h] = H;
    for (let i = 0; i < 64; i++) {
      const t1 = (h + (rot(e, 6) ^ rot(e, 11) ^ rot(e, 25)) + ((e & f) ^ (~e & g)) + K[i] + w[i]) | 0;
      const t2 = ((rot(a, 2) ^ rot(a, 13) ^ rot(a, 22)) + ((a & b) ^ (a & c) ^ (b & c))) | 0;
      h = g; g = f; f = e; e = (d + t1) | 0; d = c; c = b; b = a; a = (t1 + t2) | 0;
    }
    H[0] = (H[0] + a) | 0; H[1] = (H[1] + b) | 0; H[2] = (H[2] + c) | 0; H[3] = (H[3] + d) | 0;
    H[4] = (H[4] + e) | 0; H[5] = (H[5] + f) | 0; H[6] = (H[6] + g) | 0; H[7] = (H[7] + h) | 0;
  }
  const out = new Uint8Array(32);
  H.forEach((v, i) => { out[4 * i] = v >>> 24; out[4 * i + 1] = (v >>> 16) & 255; out[4 * i + 2] = (v >>> 8) & 255; out[4 * i + 3] = v & 255; });
  return out;
}

function concat(...arrs) {
  const out = new Uint8Array(arrs.reduce((t, a) => t + a.length, 0));
  let o = 0;
  for (const a of arrs) { out.set(a, o); o += a.length; }
  return out;
}

function hmac(key, data) {
  const k = new Uint8Array(64);
  k.set(key.length > 64 ? sha256(key) : key);
  const ip = k.map((b) => b ^ 0x36);
  const op = k.map((b) => b ^ 0x5c);
  return sha256(concat(op, sha256(concat(ip, data))));
}

const P = 0xffffffff00000001000000000000000000000000ffffffffffffffffffffffffn;
const N = 0xffffffff00000000ffffffffffffffffbce6faada7179e84f3b9cac2fc632551n;
const A = P - 3n;
const G = [
  0x6b17d1f2e12c4247f8bce6e563a440f277037d812deb33a0f4a13945d898c296n,
  0x4fe342e2fe1a7f9b8ee7eb4a7c0f9e162bce33576b315ececbb6406837bf51f5n,
];
const mod = (a, m) => { const r = a % m; return r < 0n ? r + m : r; };
function inv(a, m) {
  let [r0, r1, s0, s1] = [mod(a, m), m, 1n, 0n];
  while (r1) { const q = r0 / r1; [r0, r1] = [r1, r0 - q * r1]; [s0, s1] = [s1, s0 - q * s1]; }
  return mod(s0, m);
}
function add(p, q) {
  if (!p) return q;
  if (!q) return p;
  if (p[0] === q[0]) {
    if (mod(p[1] + q[1], P) === 0n) return null;
    const l = mod((3n * p[0] * p[0] + A) * inv(2n * p[1], P), P);
    const x = mod(l * l - 2n * p[0], P);
    return [x, mod(l * (p[0] - x) - p[1], P)];
  }
  const l = mod((q[1] - p[1]) * inv(q[0] - p[0], P), P);
  const x = mod(l * l - p[0] - q[0], P);
  return [x, mod(l * (p[0] - x) - p[1], P)];
}
function mul(k, p) {
  let r = null;
  let q = p;
  while (k > 0n) { if (k & 1n) r = add(r, q); q = add(q, q); k >>= 1n; }
  return r;
}
const toInt = (b) => b.reduce((n, x) => (n << 8n) | BigInt(x), 0n);
const toBytes = (n) => { const o = new Uint8Array(32); for (let i = 31; i >= 0; i--) { o[i] = Number(n & 255n); n >>= 8n; } return o; };

function sign(msgBytes, d) {
  const h1 = sha256(msgBytes);
  const z = mod(toInt(h1), N);
  // RFC 6979, section 3.2
  const x = toBytes(d);
  const hb = toBytes(z);
  let V = new Uint8Array(32).fill(1);
  let K = new Uint8Array(32);
  K = hmac(K, concat(V, [0], x, hb)); V = hmac(K, V);
  K = hmac(K, concat(V, [1], x, hb)); V = hmac(K, V);
  for (;;) {
    V = hmac(K, V);
    const k = toInt(V);
    if (k > 0n && k < N) {
      const R = mul(k, G);
      const r = mod(R[0], N);
      const s = mod(inv(k, N) * (z + r * d), N);
      if (r && s) return concat(toBytes(r), toBytes(s));
    }
    K = hmac(K, concat(V, [0])); V = hmac(K, V);
  }
}

const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
function b64u(bytes) {
  let s = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const n = (bytes[i] << 16) | ((bytes[i + 1] ?? 0) << 8) | (bytes[i + 2] ?? 0);
    s += B64[(n >> 18) & 63] + B64[(n >> 12) & 63];
    if (i + 1 < bytes.length) s += B64[(n >> 6) & 63];
    if (i + 2 < bytes.length) s += B64[n & 63];
  }
  return s;
}
function unb64u(s) {
  const out = [];
  let buf = 0, bits = 0;
  for (const ch of s.replace(/=+$/, '')) {
    buf = (buf << 6) | B64.indexOf(ch.replace('+', '-').replace('/', '_'));
    bits += 6;
    if (bits >= 8) { bits -= 8; out.push((buf >> bits) & 255); }
  }
  return new Uint8Array(out);
}
const ascii = (s) => Uint8Array.from(s, (c) => c.charCodeAt(0));

// Renvoie la valeur de l'en-tête Authorization pour un point d'envoi push.
function vapidAuth(endpoint, privB64u, pubB64u, subject, nowSec) {
  const aud = endpoint.match(/^https:\/\/[^/]+/)[0];
  const head = b64u(ascii(JSON.stringify({ typ: 'JWT', alg: 'ES256' })));
  const body = b64u(ascii(JSON.stringify({ aud, exp: nowSec + 12 * 3600, sub: subject })));
  const sig = b64u(sign(ascii(head + '.' + body), toInt(unb64u(privB64u))));
  return `vapid t=${head}.${body}.${sig}, k=${pubB64u}`;
}
