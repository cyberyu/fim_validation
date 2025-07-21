import http.server
import socketserver
import os

PORT = 8080
WEB_DIR = os.path.join(os.path.dirname(__file__))

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=WEB_DIR, **kwargs)

if __name__ == "__main__":
    print(f"Serving {WEB_DIR} at http://localhost:{PORT}/combined_fim_viewer.html")
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        httpd.serve_forever()
