import { LoopsClient } from 'loops';
import { getBaseUrl } from './utils/url';
import { env } from '@/lib/env';

// Email service configuration (optional feature)
// Loops.js is an optional email service for sending transactional emails
// To use Loops.js, set LOOPS_API_KEY in your environment variables
// To use a different email service, replace this implementation

// Initialize Loops client (only if API key is provided)
const loops = env.LOOPS_API_KEY ? new LoopsClient(env.LOOPS_API_KEY) : null;

// Email verification template ID (configurable via environment variable)
// Default template ID is provided for backward compatibility
// To use a custom template, set LOOPS_EMAIL_VERIFICATION_TEMPLATE_ID in your environment
const EMAIL_VERIFICATION_TEMPLATE_ID = env.LOOPS_EMAIL_VERIFICATION_TEMPLATE_ID;

export interface VerificationEmailData {
  user: {
    id: string;
    email: string;
    name: string;
  };
  url: string;
  token: string;
}

export async function sendVerificationEmail(data: VerificationEmailData): Promise<void> {
  const baseURL = getBaseUrl();
  const { user, url } = data;
  
  // Check if Loops.js is configured
  if (!loops) {
    console.error('Loops.js is not configured. Please set LOOPS_API_KEY in your environment variables.');
    throw new Error('Email service not configured');
  }
  
  try {
    await loops.sendTransactionalEmail({
      transactionalId: EMAIL_VERIFICATION_TEMPLATE_ID,
      email: user.email,
      dataVariables: {
        homeurl: baseURL,
        url: url
      }
    });
    
    console.log(`Verification email sent to ${user.email}`);
  } catch (error) {
    console.error('Failed to send verification email:', error);
    throw new Error('Failed to send verification email');
  }
}

// You can add other email functions here as needed
export async function sendPasswordResetEmail(data: { user: { email: string; name: string }, url: string }): Promise<void> {
  // Implementation for password reset emails using Loops
  // This would use a different transactional template
}