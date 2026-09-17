import nodemailer from 'nodemailer';
import { supabaseServer } from './supabaseServer';
import fs from 'fs';
import path from 'path';

interface SmtpConfig {
  user: string;
  pass: string;
  from?: string;
}

/**
 * Resolves SMTP configuration dynamically.
 * Checks environment variables first, then falls back to database settings or local settings.
 */
async function getSmtpConfig(): Promise<SmtpConfig | null> {
  // 1. Environment variables priority
  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    return {
      user: process.env.SMTP_USER.trim(),
      pass: process.env.SMTP_PASS.trim(),
      from: process.env.SMTP_FROM?.trim() || `Admissions Central <${process.env.SMTP_USER.trim()}>`,
    };
  }

  // 2. Database settings lookup
  try {
    const { data } = await supabaseServer
      .from('settings')
      .select('smtp_user, smtp_pass, smtp_from, website_name')
      .eq('id', 1)
      .maybeSingle();

    if (data?.smtp_user && data?.smtp_pass) {
      const brand = data.website_name || 'Admissions Central';
      return {
        user: data.smtp_user.trim(),
        pass: data.smtp_pass.trim(),
        from: data.smtp_from?.trim() || `${brand} <${data.smtp_user.trim()}>`,
      };
    }
  } catch {
    // ignore query error
  }

  // 3. Local file fallback
  try {
    const localPath = path.join(process.cwd(), 'data', 'settings.json');
    if (fs.existsSync(localPath)) {
      const content = fs.readFileSync(localPath, 'utf-8');
      const parsed = JSON.parse(content);
      if (parsed.smtp_user && parsed.smtp_pass) {
        const brand = parsed.website_name || 'Admissions Central';
        return {
          user: parsed.smtp_user.trim(),
          pass: parsed.smtp_pass.trim(),
          from: parsed.smtp_from?.trim() || `${brand} <${parsed.smtp_user.trim()}>`,
        };
      }
    }
  } catch {
    // ignore error
  }

  return null;
}

/**
 * Creates a configured Nodemailer transporter for Gmail / Standard SMTP.
 */
function createTransporter(config: SmtpConfig) {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: config.user,
      pass: config.pass.replace(/\s+/g, ''), // Strip spaces from Google App Password
    },
  });
}

/**
 * Sends an official counselor welcome letter with their sequential ID and 6-digit PIN.
 */
export async function sendWorkerInviteEmail(params: {
  to: string;
  workerName: string;
  workerId: string;
  pin: string;
  designation?: string;
  portalUrl?: string;
  instituteName?: string;
}): Promise<{ success: boolean; message: string; simulated?: boolean }> {
  const { to, workerName, workerId, pin, designation, portalUrl, instituteName } = params;
  const config = await getSmtpConfig();
  const brand = instituteName || 'Admissions Management Portal';
  const loginLink = portalUrl || 'http://localhost:3000/login';

  if (!config || !config.user || !config.pass) {
    console.warn(`[EMAIL NOTICE] SMTP not configured. Worker invite for ${workerName} (${to}) PIN: ${pin}`);
    return {
      success: true,
      simulated: true,
      message: 'SMTP credentials not configured yet. PIN displayed on dashboard.',
    };
  }

  const transporter = createTransporter(config);

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
        .card { max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 20px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.05); }
        .header { background: linear-gradient(135deg, #1e3a8a, #2563eb); padding: 32px 24px; text-align: center; color: #ffffff; }
        .header h1 { margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px; }
        .header p { margin: 6px 0 0 0; font-size: 13px; opacity: 0.9; }
        .content { padding: 32px 28px; }
        .greeting { font-size: 16px; font-weight: 700; color: #0f172a; margin-bottom: 12px; }
        .text { font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 24px; }
        .cred-box { background: #f0fdf4; border: 2px dashed #86efac; border-radius: 16px; padding: 20px; text-align: center; margin-bottom: 24px; }
        .cred-title { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #166534; margin-bottom: 8px; }
        .pin-code { font-family: monospace; font-size: 32px; font-weight: 900; color: #15803d; letter-spacing: 6px; margin: 4px 0; }
        .info-grid { background: #f8fafc; border-radius: 12px; padding: 16px; margin-bottom: 24px; font-size: 13px; border: 1px solid #edf2f7; }
        .info-row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #f1f5f9; }
        .info-row:last-child { border-bottom: none; }
        .btn-container { text-align: center; margin: 30px 0 10px; }
        .btn { display: inline-block; background: #2563eb; color: #ffffff !important; padding: 14px 32px; font-size: 14px; font-weight: 700; text-decoration: none; border-radius: 12px; box-shadow: 0 4px 12px rgba(37,99,235,0.25); }
        .footer { background: #f8fafc; padding: 20px 24px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <h1>${brand}</h1>
          <p>Official Admissions Fleet Onboarding</p>
        </div>
        <div class="content">
          <div class="greeting">Hello ${workerName},</div>
          <div class="text">
            You have been officially enrolled as an <strong>${designation || 'Admissions Counselor'}</strong> in the admissions management system. Use the one-time security PIN below to sign into your counselor terminal.
          </div>

          <div class="cred-box">
            <div class="cred-title">One-Time Security PIN</div>
            <div class="pin-code">${pin}</div>
            <div style="font-size: 11px; color: #166534; margin-top: 4px;">Use this 6-digit PIN as your initial login password.</div>
          </div>

          <div class="info-grid">
            <div class="info-row">
              <span style="color: #64748b;">Counselor ID:</span>
              <strong style="color: #1e293b;">${workerId}</strong>
            </div>
            <div class="info-row">
              <span style="color: #64748b;">Official Email:</span>
              <strong style="color: #1e293b;">${to}</strong>
            </div>
            <div class="info-row">
              <span style="color: #64748b;">Assigned Role:</span>
              <strong style="color: #2563eb;">${designation || 'Admissions Counselor'}</strong>
            </div>
          </div>

          <div class="btn-container">
            <a href="${loginLink}" class="btn">Sign In to Counselor Portal &rarr;</a>
          </div>

          <div style="font-size: 11px; color: #94a3b8; text-align: center; margin-top: 16px;">
            Security Notice: Do not share your security PIN with anyone. You can change your password anytime from your profile settings.
          </div>
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} ${brand}. Central Admissions Office.<br/>
          Confidential automated communication.
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    await transporter.sendMail({
      from: config.from || config.user,
      to,
      subject: `🎓 Welcome to ${brand} — Your Counselor ID (${workerId}) & Login PIN`,
      html,
    });
    return { success: true, message: `Email delivered to ${to}` };
  } catch (err: any) {
    console.error('[EMAIL ERROR] Failed to send worker invite:', err);
    return {
      success: false,
      message: err.message || 'SMTP delivery failed',
    };
  }
}

/**
 * Sends an admission confirmation voucher to student/parent upon enrollment.
 */
export async function sendStudentAdmissionEmail(params: {
  to: string;
  studentName: string;
  studentId: string;
  course: string;
  totalFee: number;
  paidAmount: number;
  balanceDue: number;
  workerName: string;
  instituteName?: string;
}): Promise<{ success: boolean; message: string; simulated?: boolean }> {
  const { to, studentName, studentId, course, totalFee, paidAmount, balanceDue, workerName, instituteName } = params;
  const config = await getSmtpConfig();
  const brand = instituteName || 'Admissions Management Portal';

  if (!config || !config.user || !config.pass) {
    return { success: true, simulated: true, message: 'SMTP not configured' };
  }

  const transporter = createTransporter(config);

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
        .card { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 20px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.05); }
        .header { background: linear-gradient(135deg, #059669, #10b981); padding: 32px 24px; text-align: center; color: #ffffff; }
        .header h1 { margin: 0; font-size: 22px; font-weight: 800; }
        .content { padding: 32px 28px; }
        .ledger { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 13px; }
        .ledger th { text-align: left; padding: 10px; background: #f8fafc; border-bottom: 2px solid #e2e8f0; color: #64748b; }
        .ledger td { padding: 10px; border-bottom: 1px solid #f1f5f9; }
        .footer { background: #f8fafc; padding: 16px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <h1>${brand}</h1>
          <p style="margin: 4px 0 0 0; font-size: 13px;">Official Provisional Admission Voucher</p>
        </div>
        <div class="content">
          <p>Dear <strong>${studentName}</strong>,</p>
          <p>Congratulations! Your admission has been registered successfully with Student ID: <strong>#${studentId}</strong> for <strong>${course}</strong>.</p>
          
          <table class="ledger">
            <thead>
              <tr><th>Description</th><th style="text-align: right;">Amount (INR)</th></tr>
            </thead>
            <tbody>
              <tr><td>Total Course Fee</td><td style="text-align: right;">₹${totalFee.toLocaleString('en-IN')}</td></tr>
              <tr><td>Amount Paid / Settled</td><td style="text-align: right; font-weight: bold; color: #059669;">₹${paidAmount.toLocaleString('en-IN')}</td></tr>
              <tr><td>Balance Due</td><td style="text-align: right; font-weight: bold; color: ${balanceDue > 0 ? '#b45309' : '#059669'};">₹${balanceDue.toLocaleString('en-IN')}</td></tr>
            </tbody>
          </table>

          <p style="font-size: 12px; color: #64748b;">Attributed Admissions Counselor: <strong>${workerName}</strong></p>
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} ${brand}. Central Admissions Office.
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    await transporter.sendMail({
      from: config.from || config.user,
      to,
      subject: `🎓 Admission Confirmation Voucher — #${studentId} (${course})`,
      html,
    });
    return { success: true, message: `Voucher sent to ${to}` };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}

/**
 * Tests an SMTP connection with the given credentials.
 */
export async function testSmtpConnection(config: SmtpConfig, testRecipient: string) {
  const transporter = createTransporter(config);
  await transporter.verify();
  const info = await transporter.sendMail({
    from: config.from || config.user,
    to: testRecipient,
    subject: `✅ SMTP Connection Verified — Admissions Central Portal`,
    text: `Your Gmail SMTP integration is working perfectly! You are all set to send automated counselor invite PINs and student vouchers for free.`,
  });
  return info;
}
