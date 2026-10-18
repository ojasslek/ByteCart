import sys
import os
from http.server import SimpleHTTPRequestHandler, HTTPServer

PORT = 3000

class Handler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

    def do_GET(self):
        req_path = self.path.split('?')[0].split('#')[0]
        if req_path in ('/', '/bytecart', '/bytecart/', '/bytecart_v2', '/bytecart_v2/'):
            self.path = '/bytecart_v2.html'
        return super().do_GET()

if __name__ == '__main__':
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    server = HTTPServer(('127.0.0.1', PORT), Handler)
    print(f'Server running at http://localhost:{PORT}/')
    sys.stdout.flush()
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
