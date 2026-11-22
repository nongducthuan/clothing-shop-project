import async from 'async';
import { Logger } from '@nestjs/common';
import { sendEmail as sendEmailDirect } from './emailService';

interface EmailTask {
  to: string;
  subject: string;
  text: string;
  language?: string;
  retries?: number;
}

const logger = new Logger('EmailQueue');

export const emailQueue = async.queue(async (task: EmailTask) => {
  const { to, subject, text, language = 'vi', retries = 0 } = task;

  try {
    const result = await sendEmailDirect(to, subject, text, language);
    if (!result.success) {
      throw new Error(result.error);
    }
    logger.log(`Successfully sent email to ${to}`);
  } catch (error) {
    console.error(`[EmailQueue] Failed to send email to ${to}:`, error);

    if (retries < 3) {
      logger.warn(`Retrying email to ${to} (Attempt ${retries + 1}/3)...`);
      setTimeout(() => {
        emailQueue.push({ ...task, retries: retries + 1 });
      }, 5000); // Wait 5 seconds before retrying
    } else {
      console.error(`[EmailQueue] Max retries reached for ${to}. Email dropped.`);
    }
  }
}, 2); // Process at most 2 emails concurrently

emailQueue.error((err) => {
  console.error('[EmailQueue] Task experienced an error:', err);
});

export const queueEmail = (to: string, subject: string, text: string, language: string = 'vi') => {
  emailQueue.push({ to, subject, text, language });
};
