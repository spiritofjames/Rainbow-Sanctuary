// Fail closed for repository-only paths. Do not read or echo the requested path.
export default function privateSource(_request, response) {
  response.setHeader("Content-Type", "text/plain; charset=utf-8");
  response.setHeader("X-Robots-Tag", "noindex, nofollow, noarchive");
  response.setHeader("Cache-Control", "no-store");
  response.status(404).end("Not found\n");
}
