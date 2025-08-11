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

const REPORT_PRICE_TEMPLATE_ID = env.LOOPS_REPORT_PRICE_TEMPLATE_ID;
const CONTACT_TEMPLATE_ID = env.LOOPS_CONTACT_TEMPLATE_ID;

export interface VerificationEmailData {
  user: {
    id: string;
    email: string;
    name: string;
  };
  url: string;
  token: string;
}

export interface ContactEmailData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export interface ReportPriceEmailData {
  user: {
    id: string;
    email: string;
    name: string;
  };
  stationName: string;
  fuelType: string;
  price: string;
  address: string;
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
        name: user.name,
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

export async function sendReportPriceThankYouEmail(data: ReportPriceEmailData): Promise<void> {
  const { user, stationName, fuelType, price, address } = data;
  
  // Check if Loops.js is configured
  if (!loops) {
    console.error('Loops.js is not configured. Please set LOOPS_API_KEY in your environment variables.');
    throw new Error('Email service not configured');
  }
  
  try {
    await loops.sendTransactionalEmail({
      transactionalId: REPORT_PRICE_TEMPLATE_ID,
      email: user.email,
      dataVariables: {
        name: user.name,
        stationName: stationName,
        fuelType: fuelType,
        price: price,
        address: address
      }
    });
    
    console.log(`Report price thank you email sent to ${user.email}`);
  } catch (error) {
    console.error('Failed to send report price thank you email:', error);
    throw new Error('Failed to send report price thank you email');
  }
}

// You can add other email functions here as needed
export async function sendPasswordResetEmail(data: { user: { email: string; name: string }, url: string }): Promise<void> {
  // Implementation for password reset emails using Loops
  // This would use a different transactional template
}

export async function sendContactMessageEmail(data: ContactEmailData): Promise<void> {
  // Ensure Loops is configured
  if (!loops) {
    console.error('Loops.js is not configured. Please set LOOPS_API_KEY in your environment variables.');
    throw new Error('Email service not configured');
  }

  if (!CONTACT_TEMPLATE_ID) {
    console.error('Missing LOOPS_CONTACT_TEMPLATE_ID for contact messages.');
    throw new Error('Contact email template not configured');
  }

  const toEmail = env.CONTACT_TO_EMAIL;
  if (!toEmail) {
    console.error('Missing CONTACT_TO_EMAIL env var for contact messages.');
    throw new Error('Destination email not configured');
  }

  try {
    await loops.sendTransactionalEmail({
      transactionalId: CONTACT_TEMPLATE_ID,
      email: toEmail,
      dataVariables: {
        name: data.name,
        email: data.email,
        subject: `${env.CONTACT_SUBJECT_PREFIX ?? ''} ${data.subject}`.trim(),
        message: data.message,
      },
    });

    console.log(`Contact message forwarded to ${toEmail}`);
  } catch (error) {
    console.error('Failed to send contact message email:', error);
    throw new Error('Failed to send contact message');
  }
}