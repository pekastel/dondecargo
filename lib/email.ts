import { LoopsClient } from 'loops';
import { getBaseUrl } from './utils/url';
import { env } from '@/lib/env';
import { safeLog } from '@/lib/utils/errors';

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
const WELCOME_TEMPLATE_ID = env.LOOPS_WELCOME_TEMPLATE_ID;
const NEWS_TEMPLATE_ID = env.LOOPS_NEWS_TEMPLATE_ID;
const NEWS_EMAIL_TO = env.NEWS_EMAIL_TO;
const REPORT_COMMENT_TEMPLATE_ID = env.LOOPS_REPORT_COMMENT_TEMPLATE_ID;
const CREATE_STATION_TEMPLATE_ID = env.LOOPS_CREATE_STATION_TEMPLATE_ID;
const STATION_APPROVED_TEMPLATE_ID = env.LOOPS_STATION_APPROVED_TEMPLATE_ID;
const STATION_REJECTED_TEMPLATE_ID = env.LOOPS_STATION_REJECTED_TEMPLATE_ID;

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

export interface WelcomeEmailData {
  user: {
    id: string;
    email: string;
    name: string;
  };
}

export interface ReportCommentEmailData {
  user: {
    id: string;
    email: string;
    name: string;
  };
  reason: string;
  observation: string;
  stationName: string;
  stationId: string;
}

export interface StationCreatedEmailData {
  user: {
    id: string;
    email: string;
    name: string;
  };
  stationName: string;
  address: string;
  fuelTypes: string;
  status: 'pendiente' | 'aprobado';
}

export interface StationApprovedEmailData {
  user: {
    id: string;
    email: string;
    name: string;
  };
  stationName: string;
  address: string;
  stationUrl: string;
}

export interface StationRejectedEmailData {
  user: {
    id: string;
    email: string;
    name: string;
  };
  stationName: string;
  address: string;
  motivo?: string;
}

export async function sendVerificationEmail(data: VerificationEmailData): Promise<void> {
  const baseURL = getBaseUrl();
  const { user, url } = data;
  
  // Check if Loops.js is configured
  if (!loops) {
    safeLog('⚠️ Email service not configured - skipping email send');
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
    safeLog('⚠️ Email service not configured - skipping email send');
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

    if (NEWS_TEMPLATE_ID && NEWS_EMAIL_TO) {
      await loops.sendTransactionalEmail({
        transactionalId: NEWS_TEMPLATE_ID,
        email: NEWS_EMAIL_TO,
        dataVariables: {
          message: `El usuario ${user.name} con email ${user.email} ha reportado el precio ${price} de ${fuelType} en ${stationName}`,
        }
      });
    }
    
    console.log(`Report price thank you email sent to ${user.email}`);
  } catch (error) {
    console.error('Failed to send report price thank you email:', error);
    throw new Error('Failed to send report price thank you email');
  }
}

export async function sendReportCommentThankYouEmail(data: ReportCommentEmailData): Promise<void> {
  const { user, reason, observation, stationName, stationId } = data;
  
  // Check if Loops.js is configured
  if (!loops) {
    safeLog('⚠️ Email service not configured - skipping email send');
    throw new Error('Email service not configured');
  }
  
  try {
    await loops.sendTransactionalEmail({
      transactionalId: REPORT_COMMENT_TEMPLATE_ID,
      email: user.email,
      dataVariables: {
        name: user.name,
        reason: reason,
        observations: observation,
      }
    });

    if (NEWS_TEMPLATE_ID && NEWS_EMAIL_TO) {
      await loops.sendTransactionalEmail({
        transactionalId: NEWS_TEMPLATE_ID,
        email: NEWS_EMAIL_TO,
        dataVariables: {
          message: `El usuario ${user.name} con email ${user.email} ha denunciado un comentario con motivo ${reason} y observación ${observation} sobre la estación ${stationName} con ID ${stationId}`,
        }
      });
    }
    
    console.log(`Report price thank you email sent to ${user.email}`);
  } catch (error) {
    console.error('Failed to send report price thank you email:', error);
    throw new Error('Failed to send report price thank you email');
  }
}

// You can add other email functions here as needed
// export async function sendPasswordResetEmail(data: { user: { email: string; name: string }, url: string }): Promise<void> {
//   // Implementation for password reset emails using Loops
//   // This would use a different transactional template
// }

export async function sendWelcomeEmail(data: WelcomeEmailData): Promise<void> {
  const baseURL = getBaseUrl();
  const { user } = data;
  
  // Check if Loops.js is configured
  if (!loops) {
    safeLog('⚠️ Email service not configured - skipping welcome email send');
    return; // Don't throw error for welcome emails, just skip silently
  }

  if (!WELCOME_TEMPLATE_ID) {
    safeLog('⚠️ Welcome email template not configured - skipping welcome email send');
    return; // Don't throw error, just skip silently
  }
  
  try {
    await loops.sendTransactionalEmail({
      transactionalId: WELCOME_TEMPLATE_ID,
      email: user.email,
      dataVariables: {
        name: user.name,
        homeurl: baseURL,
        email: user.email
      }
    });

    if (NEWS_TEMPLATE_ID && NEWS_EMAIL_TO) {
      await loops.sendTransactionalEmail({
        transactionalId: NEWS_TEMPLATE_ID,
        email: NEWS_EMAIL_TO,
        dataVariables: {
          message: `El usuario ${user.name} con email ${user.email} se ha registrado`,
        }
      });
    }
    
    console.log(`Welcome email sent to ${user.email}`);
  } catch (error) {
    console.error('Failed to send welcome email:', error);
    // Don't throw error for welcome emails, just log it
  }
}

export async function sendContactMessageEmail(data: ContactEmailData): Promise<void> {
  // Ensure Loops is configured
  if (!loops) {
    safeLog('⚠️ Email service not configured - skipping email send');
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
        subject: data.subject,
        message: data.message,
      },
    });

    console.log(`Contact message forwarded to ${toEmail}`);
  } catch (error) {
    console.error('Failed to send contact message email:', error);
    throw new Error('Failed to send contact message');
  }
}

export async function sendStationCreatedEmail(data: StationCreatedEmailData): Promise<void> {
  const baseURL = getBaseUrl();
  const { user, stationName, address, fuelTypes, status } = data;
  
  // Check if Loops.js is configured
  if (!loops) {
    safeLog('⚠️ Email service not configured - skipping email send');
    throw new Error('Email service not configured');
  }
  
  if (!CREATE_STATION_TEMPLATE_ID) {
    safeLog('⚠️ Create station email template not configured - skipping email send');
    throw new Error('Create station email template not configured');
  }
  
  try {
    const statusText = status === 'pendiente' 
      ? 'está pendiente de aprobación por nuestro equipo' 
      : 'ha sido aprobada y ya está visible en el mapa';
    
    await loops.sendTransactionalEmail({
      transactionalId: CREATE_STATION_TEMPLATE_ID,
      email: user.email,
      dataVariables: {
        name: user.name,
        homeurl: baseURL,
        stationName: stationName,
        address: address,
        fuelTypes: fuelTypes,
        status: statusText,
      }
    });

    if (NEWS_TEMPLATE_ID && NEWS_EMAIL_TO) {
      await loops.sendTransactionalEmail({
        transactionalId: NEWS_TEMPLATE_ID,
        email: NEWS_EMAIL_TO,
        dataVariables: {
          message: `El usuario ${user.name} con email ${user.email} ha dado de alta una nueva estación: ${stationName} (${address}). Estado: ${status}`,
        }
      });
    }
    
    console.log(`Station created email sent to ${user.email}`);
  } catch (error) {
    console.error('Failed to send station created email:', error);
    throw new Error('Failed to send station created email');
  }
}

export async function sendStationApprovedEmail(data: StationApprovedEmailData): Promise<void> {
  const baseURL = getBaseUrl();
  const { user, stationName, address, stationUrl } = data;
  
  // Check if Loops.js is configured
  if (!loops) {
    safeLog('⚠️ Email service not configured - skipping email send');
    return; // Non-critical, don't throw
  }
  
  if (!STATION_APPROVED_TEMPLATE_ID) {
    safeLog('⚠️ Station approved email template not configured - skipping email send');
    return; // Non-critical, don't throw
  }
  
  try {
    await loops.sendTransactionalEmail({
      transactionalId: STATION_APPROVED_TEMPLATE_ID,
      email: user.email,
      dataVariables: {
        name: user.name,
        homeurl: baseURL,
        dashboardurl: `${baseURL}/mis-estaciones`,
        stationName: stationName,
        address: address,
        stationUrl: stationUrl,
      }
    });
    
    console.log(`Station approved email sent to ${user.email}`);
  } catch (error) {
    console.error('Failed to send station approved email:', error);
    // Non-critical, don't throw
  }
}

export async function sendStationRejectedEmail(data: StationRejectedEmailData): Promise<void> {
  const baseURL = getBaseUrl();
  const { user, stationName, address, motivo } = data;
  
  // Check if Loops.js is configured
  if (!loops) {
    safeLog('⚠️ Email service not configured - skipping email send');
    return; // Non-critical, don't throw
  }
  
  if (!STATION_REJECTED_TEMPLATE_ID) {
    safeLog('⚠️ Station rejected email template not configured - skipping email send');
    return; // Non-critical, don't throw
  }
  
  try {
    await loops.sendTransactionalEmail({
      transactionalId: STATION_REJECTED_TEMPLATE_ID,
      email: user.email,
      dataVariables: {
        name: user.name,
        homeurl: baseURL,
        dashboardurl: `${baseURL}/mis-estaciones`,
        stationName: stationName,
        address: address,
        motivo: motivo || 'No se proporcionó un motivo específico',
      }
    });
    
    console.log(`Station rejected email sent to ${user.email}`);
  } catch (error) {
    console.error('Failed to send station rejected email:', error);
    // Non-critical, don't throw
  }
}