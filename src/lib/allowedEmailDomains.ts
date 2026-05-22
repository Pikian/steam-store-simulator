const ALLOWED_EMAIL_DOMAINS = [
  'trollheimstudios.com',
  'elda-entertainment.com',
];

export function isAllowedEmail(email: string): boolean {
  const domain = email.toLowerCase().trim().split('@')[1];
  return ALLOWED_EMAIL_DOMAINS.includes(domain);
}

export function allowedDomainsErrorMessage(): string {
  const formatted = ALLOWED_EMAIL_DOMAINS.map((domain) => `@${domain}`).join(' and ');
  return `Only ${formatted} email addresses are allowed`;
}

export function allowedDomainsHint(): string {
  return ALLOWED_EMAIL_DOMAINS.map((domain) => `@${domain}`).join(', ');
}
