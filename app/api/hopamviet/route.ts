import { NextRequest, NextResponse } from "next/server";

const ALLOWED_HOST = "hopamviet.vn";

export async function GET(req: NextRequest) {
  const rawUrl = req.nextUrl.searchParams.get("url");
  if (!rawUrl) return NextResponse.json({ error: "Missing url" }, { status: 400 });

  let targetUrl: URL;
  try {
    targetUrl = new URL(rawUrl);
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  if (!targetUrl.hostname.endsWith(ALLOWED_HOST)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let res: Response;
  try {
    res = await fetch(targetUrl.toString(), {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,*/*;q=0.9",
        "Accept-Language": "vi,en-US;q=0.9,en;q=0.8",
      },
    });
  } catch {
    return NextResponse.json({ error: "Fetch failed" }, { status: 502 });
  }

  const contentType = res.headers.get("Content-Type") ?? "text/html";

  // Non-HTML resources: proxy them transparently (CSS, fonts, etc.)
  if (!contentType.includes("text/html")) {
    const body = await res.arrayBuffer();
    const headers = new Headers();
    headers.set("Content-Type", contentType);
    return new NextResponse(body, { headers });
  }

  let html = await res.text();
  const base = `https://${ALLOWED_HOST}`;

  // Derive the app origin from the incoming request so rewritten links are absolute
  // and not affected by the <base> tag we inject below
  const host = req.headers.get("host") ?? "localhost:3000";
  const proto = req.headers.get("x-forwarded-proto") ?? "http";
  const appOrigin = `${proto}://${host}`;

  // Inject <base> so relative src/href for assets (images, CSS, JS) resolve correctly
  html = html.replace(/(<head[^>]*>)/i, `$1<base href="${base}">`);

  // Rewrite <a href> links that point to hopamviet.vn or are root-relative so that
  // navigating within the iframe stays in our proxy.
  // Must use absolute appOrigin URLs — relative paths would be resolved against <base>
  // and end up on hopamviet.vn instead of our Next.js server.
  html = html.replace(
    /(<a\b[^>]*?\s)href="((?:https?:\/\/hopamviet\.vn)?\/[^"#][^"]*)"/gi,
    (_match, before, path) => {
      const absolute = path.startsWith("http") ? path : `${base}${path}`;
      return `${before}href="${appOrigin}/api/hopamviet?url=${encodeURIComponent(absolute)}"`;
    }
  );

  const headers = new Headers();
  headers.set("Content-Type", "text/html; charset=utf-8");
  // Intentionally omit X-Frame-Options so we can embed this in our own iframe

  return new NextResponse(html, { headers });
}
