import http.server
import socketserver
import os
import urllib.parse
import mimetypes
import re

PORT = 3000
PORTFOLIO_DIR = r"C:\Users\amina\Desktop\amin-portfolio"

PROJECTS = {
    "resto-arts": r"C:\Users\amina\Desktop\New folder\restaurents des arts\dist",
    "numa": r"C:\Users\amina\Desktop\numa\dist",
    "kikos": r"C:\Users\amina\Desktop\kikos\out",
    "hedera": r"C:\Users\amina\Desktop\hedera\dist",
    "velocity-math": r"C:\Users\amina\Desktop\ma\build\web",
    "monster-gym": r"C:\Users\amina\Desktop\monster gym",
    "tedx-tbs": r"C:\Users\amina\Desktop\Tedxtbswe",
    "profile": r"C:\Users\amina\Desktop\profile",
    "safonas": r"C:\Users\amina\Desktop\safonas",
    "codlock": r"C:\Users\amina\Desktop\codlock\demo"
}

class ReliablePreviewHandler(http.server.BaseHTTPRequestHandler):
    def send_cors_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', '*')
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        # Allow embedding in iframes
        self.send_header('X-Frame-Options', 'ALLOWALL')

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_cors_headers()
        self.end_headers()

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        clean_path = urllib.parse.unquote(parsed.path).lstrip('/')

        # 1. Main portfolio
        if not clean_path or clean_path in ['index.html', 'favicon.ico']:
            file_path = os.path.join(PORTFOLIO_DIR, clean_path or 'index.html')
            self.serve_file(file_path)
            return

        # Check if it's a file inside PORTFOLIO_DIR
        portfolio_candidate = os.path.join(PORTFOLIO_DIR, clean_path)
        if os.path.isfile(portfolio_candidate):
            self.serve_file(portfolio_candidate)
            return

        # 2. Check preview route: /preview/<slug>/...
        if clean_path.startswith('preview/'):
            parts = clean_path.split('/', 2)
            slug = parts[1] if len(parts) > 1 else ""
            subpath = parts[2] if len(parts) > 2 else ""

            if slug in PROJECTS:
                proj_root = PROJECTS[slug]
                target_file = os.path.join(proj_root, subpath or 'index.html')
                if os.path.isdir(target_file):
                    target_file = os.path.join(target_file, 'index.html')
                
                if os.path.isfile(target_file):
                    if target_file.lower().endswith('.html'):
                        self.serve_html_with_base(target_file, f"/preview/{slug}/")
                        return
                    else:
                        self.serve_file(target_file)
                        return

        # 3. Referer-based fallback for root-relative assets (e.g. /assets/xxx.js or /_next/xxx.js)
        referer = self.headers.get('Referer', '')
        if referer:
            ref_parsed = urllib.parse.urlparse(referer)
            ref_path = urllib.parse.unquote(ref_parsed.path).lstrip('/')
            if ref_path.startswith('preview/'):
                ref_slug = ref_path.split('/')[1]
                if ref_slug in PROJECTS:
                    proj_root = PROJECTS[ref_slug]
                    candidate = os.path.join(proj_root, clean_path)
                    if os.path.isfile(candidate):
                        self.serve_file(candidate)
                        return

        # 4. Search across all projects for the file (e.g., if /assets/... was requested without referer)
        for slug, proj_root in PROJECTS.items():
            candidate = os.path.join(proj_root, clean_path)
            if os.path.isfile(candidate):
                self.serve_file(candidate)
                return

        # 404
        self.send_response(404)
        self.send_cors_headers()
        self.send_header('Content-Type', 'text/plain; charset=utf-8')
        self.end_headers()
        self.wfile.write(b"404 Not Found")

    def serve_html_with_base(self, file_path, base_href):
        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
            
            # Inject base tag so all relative assets, CSS, images, and JS resolve properly
            base_tag = f'<base href="{base_href}">'
            if '<head' in content.lower():
                content = re.sub(r'(<head[^>]*>)', r'\1' + base_tag, content, count=1, flags=re.IGNORECASE)
            else:
                content = base_tag + content

            encoded = content.encode('utf-8')
            self.send_response(200)
            self.send_cors_headers()
            self.send_header('Content-Type', 'text/html; charset=utf-8')
            self.send_header('Content-Length', str(len(encoded)))
            self.end_headers()
            self.wfile.write(encoded)
        except Exception as e:
            self.send_error(500, str(e))

    def serve_file(self, file_path):
        try:
            ctype, _ = mimetypes.guess_type(file_path)
            if not ctype:
                if file_path.endswith('.js') or file_path.endswith('.mjs'):
                    ctype = 'application/javascript'
                elif file_path.endswith('.wasm'):
                    ctype = 'application/wasm'
                elif file_path.endswith('.css'):
                    ctype = 'text/css'
                else:
                    ctype = 'application/octet-stream'

            size = os.path.getsize(file_path)
            with open(file_path, 'rb') as f:
                self.send_response(200)
                self.send_cors_headers()
                self.send_header('Content-Type', ctype)
                self.send_header('Content-Length', str(size))
                self.end_headers()
                self.wfile.write(f.read())
        except Exception as e:
            self.send_error(500, str(e))

    def log_message(self, format, *args):
        # suppress spammy logging
        pass

if __name__ == '__main__':
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), ReliablePreviewHandler) as httpd:
        print(f"Reliable Preview Server running on http://localhost:{PORT}")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            pass
