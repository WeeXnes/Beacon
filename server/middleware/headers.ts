export default defineEventHandler((event) => {
  // Set security headers to protect against clickjacking, mime-sniffing, cross-site leaks, etc.
  setHeader(event, 'X-Frame-Options', 'DENY');
  setHeader(event, 'X-Content-Type-Options', 'nosniff');
  setHeader(event, 'Referrer-Policy', 'strict-origin-when-cross-origin');
  setHeader(event, 'Content-Security-Policy', "frame-ancestors 'none';");
  setHeader(event, 'X-XSS-Protection', '1; mode=block');
});
