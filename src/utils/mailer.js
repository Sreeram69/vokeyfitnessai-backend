const nodemailer = require("nodemailer");

// Helper to get the correct verified sender email address
const getSenderEmail = () => {
  const smtpUser = process.env.SMTP_USER;
  if (!smtpUser) return "ramsreeram249@gmail.com";
  // If it's a Brevo login username (like ac76c601@smtp-brevo.com), we must use the verified registered Gmail address
  if (smtpUser.includes("smtp-brevo.com")) {
    return "ramsreeram249@gmail.com";
  }
  return smtpUser;
};

// Asynchronous fire-and-forget mailer
const sendOtpEmail = async (email, otpCode, purpose = "email_verification", username = "Athlete") => {
  // Always log the OTP code to the server console instantly for local convenience
  console.log(`\n=============================================`);
  console.log(`[OTP MAILER] Target Email: ${email}`);
  console.log(`[OTP MAILER] Purpose: ${purpose}`);
  console.log(`[OTP MAILER] Verification Code: ${otpCode}`);
  console.log(`=============================================\n`);

  const purposeTitle = purpose === "password_reset" ? "Password Reset Calibration" : "Account Verification Calibration";
  const purposeText = purpose === "password_reset" 
    ? "We received a request to reset your password. Use the security code below to complete the reset:"
    : "We received a request to verify your account credentials. Use the 6-digit security code below to complete the onboarding:";

  const htmlContent = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0B0F17; color: #F3F4F6; padding: 40px 20px; border-radius: 16px; max-w: 600px; margin: 0 auto; border: 1px solid #1E293B;">
      <div style="text-align: center; margin-bottom: 30px;">
        <div style="display: inline-block; padding: 12px; background-color: rgba(124, 58, 237, 0.1); border-radius: 12px; border: 1px solid rgba(124, 58, 237, 0.2); margin-bottom: 16px;">
          <span style="font-size: 24px;">⚡</span>
        </div>
        <h1 style="font-size: 24px; font-weight: 800; color: #FFFFFF; margin: 0; letter-spacing: -0.025em;">VokeyFitness AI</h1>
        <p style="font-size: 14px; color: #94A3B8; margin-top: 4px; margin-bottom: 0;">${purposeTitle}</p>
      </div>
      
      <div style="background-color: #111827; border: 1px solid #1E293B; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
        <p style="font-size: 14px; line-height: 1.5; color: #D1D5DB; margin-top: 0; margin-bottom: 20px;">
          Greetings ${username},
        </p>
        <p style="font-size: 14px; line-height: 1.5; color: #D1D5DB; margin-bottom: 24px;">
          ${purposeText}
        </p>
        
        <div style="background-color: #0B0F17; border: 1px solid #1E293B; border-radius: 8px; padding: 16px; text-align: center; font-size: 32px; font-weight: 800; letter-spacing: 0.2em; color: #7C3AED; margin-bottom: 24px;">
          ${otpCode}
        </div>
        
        <p style="font-size: 11px; line-height: 1.4; color: #64748B; margin-bottom: 0;">
          This calibration code is highly secure and expires in 5 minutes. If you did not make this request, please disregard this email or update your credentials immediately.
        </p>
      </div>
      
      <div style="text-align: center; font-size: 11px; color: #475569; border-top: 1px solid #1E293B; padding-top: 20px;">
        <p style="margin: 0;">&copy; 2026 VokeyFitness Systems Inc. All rights reserved.</p>
        <p style="margin: 4px 0 0 0;">Designed with high performance and intelligence.</p>
      </div>
    </div>
  `;

  // 1. Try sending via Resend API if API key is provided
  const resendApiKey = process.env.RESEND_API_KEY;
  if (resendApiKey) {
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "VokeyFitness <onboarding@resend.dev>",
          to: email,
          subject: `VokeyFitness — OTP Verification: ${otpCode}`,
          html: htmlContent,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        console.log(`[OTP MAILER] Resend email dispatched. ID: ${data.id}`);
        return;
      } else {
        console.error(`[OTP MAILER] Resend returned error:`, data);
      }
    } catch (e) {
      console.error("[OTP MAILER] Resend connection failed, falling back to SMTP:", e.message);
    }
  }

  // 2. Try sending via Brevo REST API if Brevo API key is provided
  const brevoApiKey = process.env.BREVO_API_KEY || process.env.SMTP_PASS;
  const isBrevoApiKey = brevoApiKey && (brevoApiKey.startsWith("xkeysib-") || process.env.BREVO_API_KEY);
  if (isBrevoApiKey) {
    try {
      const response = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "accept": "application/json",
          "api-key": brevoApiKey,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          sender: { name: "VokeyFitness AI", email: getSenderEmail() },
          to: [{ email }],
          subject: `VokeyFitness — OTP Verification Code: ${otpCode}`,
          htmlContent: htmlContent,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        console.log(`[OTP MAILER] Brevo REST API email dispatched. ID: ${data.messageId}`);
        return;
      } else {
        console.error(`[OTP MAILER] Brevo REST API returned error:`, data);
      }
    } catch (e) {
      console.error("[OTP MAILER] Brevo REST API connection failed, falling back to SMTP:", e.message);
    }
  }

  // 3. Fallback to standard SMTP or Ethereal test mailer
  try {
    let transporter;
    const hasSmtp = process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS;

    if (hasSmtp) {
      const isGmail = process.env.SMTP_HOST === "smtp.gmail.com" || process.env.SMTP_USER.endsWith("@gmail.com");
      if (isGmail) {
        transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        });
      } else {
        transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: parseInt(process.env.SMTP_PORT) || 587,
          secure: process.env.SMTP_SECURE === "true",
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        });
      }
    } else {
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
    }

    const mailOptions = {
      from: `"VokeyFitness AI" <${getSenderEmail()}>`,
      to: email,
      subject: `VokeyFitness — OTP Verification Code: ${otpCode}`,
      html: htmlContent,
    };

    const info = await transporter.sendMail(mailOptions);
    if (!hasSmtp) {
      console.log(`[OTP MAILER] Ethereal Web Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
    }
  } catch (error) {
    console.error("[OTP MAILER] Failed to send verification email:", error.message);
  }
};

module.exports = { sendOtpEmail };
