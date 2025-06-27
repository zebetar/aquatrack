
'use server';

/**
 * Checks if the GOOGLE_API_KEY is available on the server.
 * This is a safe way to check for the key without exposing it to the client.
 * @returns {Promise<{isConfigured: boolean}>} A promise that resolves to an object indicating if the key is configured.
 */
export async function checkApiKeyStatus(): Promise<{ isConfigured: boolean }> {
  // process.env is only available on the server.
  const isConfigured = !!process.env.GOOGLE_API_KEY;
  return { isConfigured };
}
