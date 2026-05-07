export function verificationEmailHtml({ name, url }: { name: string; url: string }): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Confirm your Owó-mi account</title>
</head>
<body style="margin:0;padding:0;background:#fafaf7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#fafaf7;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border-radius:16px;border:1px solid #e5e5e5;overflow:hidden;">
        <tr>
          <td style="padding:32px 40px 24px;border-bottom:1px solid #f0f0f0;">
            <p style="margin:0;font-size:18px;font-weight:600;color:#111827;">
              <span style="color:#0e6b4f;">✦</span> Owó-mi
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:32px 40px;">
            <h1 style="margin:0 0 12px;font-size:22px;font-weight:700;color:#111827;line-height:1.3;">
              Confirm your account, ${escapeHtml(name.split(' ')[0])}
            </h1>
            <p style="margin:0 0 24px;font-size:15px;color:#6b7280;line-height:1.6;">
              Click the button below to verify your email address and activate your Owó-mi account.
              This link expires in 24 hours.
            </p>
            <a href="${escapeHtml(url)}" style="display:inline-block;background:#0e6b4f;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;padding:13px 28px;border-radius:10px;">
              Confirm my account →
            </a>
            <p style="margin:24px 0 0;font-size:13px;color:#9ca3af;">
              If you didn't create an Owó-mi account, you can safely ignore this email.
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 40px;background:#f9fafb;border-top:1px solid #f0f0f0;">
            <p style="margin:0;font-size:12px;color:#9ca3af;">
              🍁 Owó-mi — Built in Canada. Data stored in Montréal. PIPEDA compliant.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

export function invitationEmailHtml({
  inviterName,
  orgName,
  url,
}: {
  inviterName: string
  orgName: string
  url: string
}): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>You've been invited to join ${escapeHtml(orgName)} on Owó-mi</title>
</head>
<body style="margin:0;padding:0;background:#fafaf7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#fafaf7;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border-radius:16px;border:1px solid #e5e5e5;overflow:hidden;">
        <tr>
          <td style="padding:32px 40px 24px;border-bottom:1px solid #f0f0f0;">
            <p style="margin:0;font-size:18px;font-weight:600;color:#111827;">
              <span style="color:#0e6b4f;">✦</span> Owó-mi
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:32px 40px;">
            <h1 style="margin:0 0 12px;font-size:22px;font-weight:700;color:#111827;line-height:1.3;">
              ${escapeHtml(inviterName)} invited you to join their family
            </h1>
            <p style="margin:0 0 24px;font-size:15px;color:#6b7280;line-height:1.6;">
              You've been invited to join <strong style="color:#111827;">${escapeHtml(orgName)}</strong> on Owó-mi —
              a private, Canadian finance tracker. Click below to accept the invitation.
            </p>
            <a href="${escapeHtml(url)}" style="display:inline-block;background:#0e6b4f;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;padding:13px 28px;border-radius:10px;">
              Accept invitation →
            </a>
            <p style="margin:24px 0 0;font-size:13px;color:#9ca3af;">
              This invitation expires in 48 hours. If you don't know ${escapeHtml(inviterName)},
              you can safely ignore this email.
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 40px;background:#f9fafb;border-top:1px solid #f0f0f0;">
            <p style="margin:0;font-size:12px;color:#9ca3af;">
              🍁 Owó-mi — Built in Canada. Data stored in Montréal. PIPEDA compliant.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}
