import http.server, os, sys
REPO=os.environ.get('REPO','.'); T=os.environ['THREE_DIR']   # THREE_DIR = thư mục clone three.js r160 (có build/ và examples/jsm/)
class H(http.server.SimpleHTTPRequestHandler):
    def translate_path(self,path):
        path=path.split('?')[0]
        if path.startswith('/__three/'): return os.path.join(T,path[len('/__three/'):])
        return os.path.join(REPO,path.lstrip('/'))
    def do_GET(self):
        if self.path.split('?')[0] in ('/','/index.html'):
            b=open(os.path.join(REPO,'index.html'),'rb').read().replace(b'https://cdn.jsdelivr.net/npm/three@0.160.1/',b'/__three/')
            self.send_response(200); self.send_header('Content-Type','text/html; charset=utf-8'); self.send_header('Content-Length',str(len(b))); self.end_headers(); self.wfile.write(b); return
        return super().do_GET()
    def log_message(self,*a): pass
http.server.ThreadingHTTPServer(('127.0.0.1',8093),H).serve_forever()
