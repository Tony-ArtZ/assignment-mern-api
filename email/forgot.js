export const mailData = (toEmail, verificationToken) => ({
  from: process.env.FROM_EMAIL,
  to: toEmail,
  subject: "Forgot Password?",
  html: `<b>Please follow the link to reset your password.</b>
                <a href="${process.env.PUBLIC_SERVER_URL}/reset-password?token=${verificationToken}">Reset Password</a>`,
});
