const PASSWORD = process.env.APP_PASSWORD || '';
const AUTH_TOKEN = btoa(PASSWORD).replace(/=/g, '');

function loginPage(error = false): Response {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>NFL Historical Database</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #0a0f1a;
      color: #e0e0e0;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }
    .login-box {
      background: #141b2d;
      border: 1px solid #1e2a45;
      border-radius: 12px;
      padding: 2.5rem;
      width: 100%;
      max-width: 400px;
      text-align: center;
    }
    h1 {
      font-size: 1.5rem;
      color: #fff;
      margin-bottom: 0.25rem;
    }
    .subtitle {
      color: #8899aa;
      font-size: 0.8rem;
      margin-bottom: 2rem;
    }
    .gold-line {
      width: 60px;
      height: 3px;
      background: #d4af37;
      margin: 1rem auto;
      border-radius: 2px;
    }
    label {
      display: block;
      text-align: left;
      font-size: 0.72rem;
      color: #8899aa;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 0.4rem;
    }
    input[type="password"] {
      width: 100%;
      padding: 0.65rem 0.75rem;
      border: 1px solid #2a3a55;
      border-radius: 4px;
      background: #0d1321;
      color: #e0e0e0;
      font-size: 0.95rem;
      margin-bottom: 1.25rem;
    }
    input:focus {
      outline: none;
      border-color: #d4af37;
    }
    button {
      width: 100%;
      padding: 0.65rem;
      background: linear-gradient(135deg, #d4af37 0%, #b8941e 100%);
      border: none;
      border-radius: 5px;
      color: #0a0f1a;
      font-size: 0.9rem;
      font-weight: 700;
      cursor: pointer;
      transition: opacity 0.15s;
    }
    button:hover { opacity: 0.9; }
    .error {
      color: #f87171;
      font-size: 0.82rem;
      margin-bottom: 1rem;
    }
  </style>
</head>
<body>
  <div class="login-box">
    <h1>NFL Historical Database</h1>
    <p class="subtitle">14,000+ games from 1966&ndash;2025</p>
    <div class="gold-line"></div>
    ${error ? '<p class="error">Incorrect password. Try again.</p>' : ''}
    <form method="POST" action="/_auth">
      <label for="password">Password</label>
      <input type="password" id="password" name="password" placeholder="Enter password" autofocus required>
      <button type="submit">Access Database</button>
    </form>
  </div>
</body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}

function getCookie(request: Request, name: string): string | null {
  const cookie = request.headers.get('cookie');
  if (!cookie) return null;
  const match = cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? match[1] : null;
}

export default async function middleware(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const { pathname } = url;

  // Handle login form submission
  if (pathname === '/_auth' && request.method === 'POST') {
    const formData = await request.formData();
    const password = formData.get('password') as string;

    if (password === PASSWORD) {
      const redirectUrl = new URL('/', url);
      return new Response(null, {
        status: 302,
        headers: {
          'Location': redirectUrl.toString(),
          'Set-Cookie': `nfl-auth=${AUTH_TOKEN}; HttpOnly; Secure; SameSite=Lax; Max-Age=${60 * 60 * 24 * 365}; Path=/`,
        },
      });
    }

    return loginPage(true);
  }

  // Check auth cookie
  const authCookie = getCookie(request, 'nfl-auth');
  if (authCookie === AUTH_TOKEN) {
    return fetch(request);
  }

  // Not authenticated — show login
  return loginPage(false);
}

export const config = {
  matcher: ['/((?!_vercel|favicon.ico).*)'],
};
