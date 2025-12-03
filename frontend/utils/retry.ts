/**
 * Retry a function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3, // Reduced from 5 to 3 for faster failure
  initialDelay: number = 1000 // Reduced from 2000ms to 1000ms
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      
      // Check if it's a rate limit error (multiple formats)
      const errorCode = error?.code || error?.error?.code || error?.data?.httpStatus;
      const errorMessage = (error?.message || error?.error?.message || error?.error?.data?.message || '').toLowerCase();
      const httpStatus = error?.data?.httpStatus || error?.error?.data?.httpStatus;
      const isRateLimit = 
        errorMessage.includes('rate limit') ||
        errorMessage.includes('rate limited') ||
        errorMessage.includes('being rate limited') ||
        errorCode === -32603 ||
        errorCode === -32005 ||
        httpStatus === 429 ||
        error?.error?.code === -32603 ||
        error?.error?.code === -32005;
      
      if (!isRateLimit || attempt === maxRetries - 1) {
        if (isRateLimit && attempt === maxRetries - 1) {
          throw new Error('Rate limit exceeded. Please wait 30-60 seconds and try again, or upgrade your RPC provider plan.');
        }
        throw error;
      }
      
      // Exponential backoff: 1s, 2s, 4s (faster retries)
      const delay = initialDelay * Math.pow(2, attempt);
      console.warn(`⚠️ Rate limited. Retrying in ${delay / 1000}s... (attempt ${attempt + 1}/${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError || new Error('Max retries exceeded');
}

