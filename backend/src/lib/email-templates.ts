/**
 * Transactional email templates.
 *
 * Table-based layout with inline styles — the only thing that survives Outlook
 * and Gmail. Palette mirrors frontend/src/styles.css so mail looks like the site.
 */

const GOLD = '#d9ae5c';
const GOLD_SOFT = '#e8c98a';
const BG = '#0a0a0d';
const CARD = '#17161b';
const BORDER = '#2a2620';
const TEXT = '#f3f2ef';
const MUTED = '#9a989f';
const RED = '#e74c3c';
const GREEN = '#2ecc71';

function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL || 'https://muzikanaklik.com';
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** subscription_plans.price is stored in cents, same as Stripe's unit_amount. */
export function formatAmount(cents: number): string {
  return `${(cents / 100).toLocaleString('sr-RS', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('sr-RS', { day: 'numeric', month: 'long', year: 'numeric' });
}

function button(href: string, label: string): string {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:28px 0;">
      <tr>
        <td align="center" bgcolor="${GOLD}" style="border-radius:8px;">
          <a href="${href}" style="display:inline-block;padding:14px 32px;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:bold;color:#1b1409;text-decoration:none;border-radius:8px;">${label}</a>
        </td>
      </tr>
    </table>`;
}

function layout(opts: { preheader: string; heading: string; body: string }): string {
  return `<!doctype html>
<html lang="sr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="dark">
<title>Muzika na Klik</title>
</head>
<body style="margin:0;padding:0;background-color:${BG};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(opts.preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${BG}" style="background-color:${BG};padding:32px 16px;">
  <tr>
    <td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;">

        <tr>
          <td align="center" style="padding-bottom:24px;">
            <a href="${siteUrl()}" style="font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:bold;color:${TEXT};text-decoration:none;letter-spacing:0.5px;">
              Muzika <span style="color:${GOLD};">na Klik</span>
            </a>
          </td>
        </tr>

        <tr>
          <td bgcolor="${CARD}" style="background-color:${CARD};border:1px solid ${BORDER};border-radius:14px;padding:36px 32px;">
            <h1 style="margin:0 0 20px;font-family:Arial,Helvetica,sans-serif;font-size:21px;line-height:1.35;color:${TEXT};font-weight:bold;">${opts.heading}</h1>
            ${opts.body}
          </td>
        </tr>

        <tr>
          <td style="padding-top:24px;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.7;color:${MUTED};text-align:center;">
            Ovo je automatska poruka sa sajta <a href="${siteUrl()}" style="color:${GOLD};text-decoration:none;">muzikanaklik.com</a>.<br>
            Ako misliš da si je dobio/la greškom, slobodno je ignoriši.
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}

function p(text: string): string {
  return `<p style="margin:0 0 16px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.65;color:${TEXT};">${text}</p>`;
}

function muted(text: string): string {
  return `<p style="margin:16px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.6;color:${MUTED};">${text}</p>`;
}

function rows(items: Array<[string, string]>, accent: string): string {
  const body = items
    .map(
      ([label, value]) => `
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid ${BORDER};font-family:Arial,Helvetica,sans-serif;font-size:14px;color:${MUTED};">${escapeHtml(label)}</td>
        <td align="right" style="padding:10px 0;border-bottom:1px solid ${BORDER};font-family:Arial,Helvetica,sans-serif;font-size:14px;color:${TEXT};font-weight:bold;">${escapeHtml(value)}</td>
      </tr>`
    )
    .join('');

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0;border-left:3px solid ${accent};padding-left:16px;">
      ${body}
    </table>`;
}

const periodLabel = (billingPeriod: 'monthly' | 'yearly') =>
  billingPeriod === 'yearly' ? 'Godišnja' : 'Mesečna';

export function verificationEmail(params: { name: string; confirmUrl: string }): { subject: string; html: string } {
  const name = escapeHtml(params.name);

  return {
    subject: 'Potvrdi svoju email adresu — Muzika na Klik',
    html: layout({
      preheader: 'Ostao je još jedan klik do aktivacije naloga.',
      heading: `Dobrodošao/la, ${name}!`,
      body:
        p('Nalog je napravljen. Ostalo je samo da potvrdiš email adresu kako bi mogao/la da se prijaviš.') +
        button(params.confirmUrl, 'Potvrdi email adresu') +
        muted(
          `Link važi 24 sata. Ako dugme ne radi, prekopiraj ovu adresu u pregledač:<br><span style="color:${GOLD_SOFT};word-break:break-all;">${escapeHtml(params.confirmUrl)}</span>`
        ),
    }),
  };
}

export function paymentSuccessEmail(params: {
  name: string;
  planName: string;
  billingPeriod: 'monthly' | 'yearly';
  amountCents: number;
  periodStart: Date | string;
  periodEnd: Date | string;
}): { subject: string; html: string } {
  const name = escapeHtml(params.name);
  const plan = escapeHtml(params.planName);

  return {
    subject: `Uplata primljena — paket ${params.planName}`,
    html: layout({
      preheader: `Pretplata je aktivna do ${formatDate(params.periodEnd)}.`,
      heading: 'Uplata je uspešno primljena',
      body:
        p(`Hvala ti, ${name}! Paket <strong style="color:${GOLD};">${plan}</strong> je aktiviran i sve pogodnosti su ti odmah dostupne.`) +
        rows(
          [
            ['Paket', params.planName],
            ['Pretplata', periodLabel(params.billingPeriod)],
            ['Iznos', formatAmount(params.amountCents)],
            ['Period važenja', `${formatDate(params.periodStart)} — ${formatDate(params.periodEnd)}`],
          ],
          GREEN
        ) +
        button(`${siteUrl()}/moj-nalog/izvodjac/pretplata`, 'Pogledaj pretplatu') +
        muted(
          `Pretplata ističe <strong style="color:${TEXT};">${formatDate(params.periodEnd)}</strong> i ne obnavlja se automatski — poslaćemo podsetnik pre isteka.`
        ),
    }),
  };
}

export function paymentFailedEmail(params: {
  name: string;
  planName: string;
  reason?: string;
}): { subject: string; html: string } {
  const name = escapeHtml(params.name);
  const plan = escapeHtml(params.planName);
  const reasonBlock = params.reason
    ? rows([['Razlog', params.reason]], RED)
    : '';

  return {
    subject: 'Pokušaj plaćanja nije uspeo — Muzika na Klik',
    html: layout({
      preheader: 'Kartica je odbijena, ali možeš odmah pokušati ponovo.',
      heading: 'Plaćanje nije prošlo',
      body:
        p(`${name}, pokušaj plaćanja za paket <strong style="color:${GOLD};">${plan}</strong> nije uspeo — banka je odbila transakciju.`) +
        reasonBlock +
        p('Novac nije skinut sa računa. Najčešće pomaže druga kartica ili provera limita za onlajn plaćanja kod banke.') +
        button(`${siteUrl()}/moj-nalog/izvodjac/pretplata`, 'Pokušaj ponovo') +
        muted('Ako si u međuvremenu već uspešno platio/la, ovu poruku slobodno zanemari.'),
    }),
  };
}

export function checkoutExpiredEmail(params: {
  name: string;
  planName: string;
}): { subject: string; html: string } {
  const name = escapeHtml(params.name);
  const plan = escapeHtml(params.planName);

  return {
    subject: 'Nisi završio/la pretplatu — Muzika na Klik',
    html: layout({
      preheader: 'Plaćanje je ostalo nedovršeno, možeš ga nastaviti kad god.',
      heading: 'Pretplata je ostala nedovršena',
      body:
        p(`${name}, započeo/la si plaćanje paketa <strong style="color:${GOLD};">${plan}</strong>, ali ono nije završeno pa je sesija istekla.`) +
        p('Ništa nije naplaćeno. Profil ti i dalje stoji na besplatnom paketu — možeš nastaviti kad god poželiš.') +
        button(`${siteUrl()}/moj-nalog/izvodjac/pretplata`, 'Nastavi pretplatu') +
        muted('Ako si se predomislio/la, ne moraš ništa da radiš.'),
    }),
  };
}
