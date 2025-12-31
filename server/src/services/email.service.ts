import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 465,
  secure: false, // true only for 465
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export class EmailService {
  static async sendPasswordResetEmail(to: string, resetLink: string) {
    await transporter.sendMail({
      from: `"Support Team" <${process.env.SMTP_USER}>`,
      to,
      subject: "Reset your password",
      html: `
        <div style="font-family: Arial, sans-serif">
          <h2>Password Reset Request</h2>
          <p>You requested to reset your password.</p>
          <p>
            <a href="${resetLink}"
               style="padding:10px 16px;background:#000;color:#fff;text-decoration:none;border-radius:4px">
              Reset Password
            </a>
          </p>
          <p>This link will expire in 1 hour.</p>
          <p>If you did not request this, please ignore this email.</p>
        </div>
      `,
    });
  }
}
