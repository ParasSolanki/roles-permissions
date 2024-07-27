// Constants
const SALT_LENGTH = 32;

// Helper function to convert ArrayBuffer to hexadecimal string
function buf2hex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function generateSalt(): Promise<string> {
  const randomBytes = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  return buf2hex(randomBytes.buffer);
}

async function generateCsrfToken(
  salt: string,
  secret: string
): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(salt + secret);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hash = buf2hex(hashBuffer);
  return salt + hash;
}

export async function createCsrfToken(secret: string): Promise<string> {
  const salt = await generateSalt();
  return generateCsrfToken(salt, secret);
}

export async function validateCsrfToken(
  token: string | undefined,
  secret: string
): Promise<boolean> {
  if (typeof token !== "string") return false;
  const salt = token.slice(0, SALT_LENGTH * 2);
  const generatedToken = await generateCsrfToken(salt, secret);
  return token === generatedToken;
}
