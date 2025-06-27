'use server';

export async function checkApiKeyStatus() {
  const hasKey = !!process.env.GOOGLE_API_KEY;
  return { hasKey };
}
