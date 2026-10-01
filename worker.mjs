const aliases = new Set(['www.cypherbaltics.org','cypherbaltics.com','www.cypherbaltics.com']);
export default {
 async fetch(request, env) {
  const url = new URL(request.url);
  if (aliases.has(url.hostname) || (url.hostname === 'cypherbaltics.org' && url.protocol === 'http:')) {
   url.hostname = 'cypherbaltics.org'; url.protocol = 'https:'; url.port = '';
   return Response.redirect(url.href, 301);
  }
  const response = await env.ASSETS.fetch(request);
  const headers = new Headers(response.headers);
  headers.set('X-Content-Type-Options','nosniff');
  headers.set('Referrer-Policy','strict-origin-when-cross-origin');
  headers.set('Permissions-Policy','camera=(), microphone=(), geolocation=()');
  headers.set('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'");
  if (headers.get('Content-Type')?.includes('text/html')) headers.set('Cache-Control','public, max-age=0, must-revalidate');
  return new Response(response.body, {status:response.status,statusText:response.statusText,headers});
 }
};
