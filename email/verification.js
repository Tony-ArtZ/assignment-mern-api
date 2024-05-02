export const mailData = (toEmail, verificationToken) => ({
  from: process.env.FROM_EMAIL,
  to: toEmail,
  subject: "Please Verify Your Email",
  html: `<b>Thank you for creating an account. Please follow the link to verify your email.</b>
              <a href="${process.env.PUBLIC_SERVER_URL}/verify-email?token=${verificationToken}">Verify Email</a>`,
});
