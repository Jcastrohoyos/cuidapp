"""Servidor estático de la landing para desarrollo.

Igual que `python -m http.server` pero con `Cache-Control: no-store`, para que
el navegador siempre recargue HTML/CSS/JS y no se quede con copias viejas al
editar (el http.server por defecto deja que el navegador cachee por heurística).

Uso:  python serve.py [puerto] [directorio]
"""
import sys
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer


class SinCacheHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, must-revalidate")
        super().end_headers()

    def log_message(self, *args):
        pass  # Silencioso: no llenar la consola en modo desarrollo.


if __name__ == "__main__":
    puerto = int(sys.argv[1]) if len(sys.argv) > 1 else 8123
    directorio = sys.argv[2] if len(sys.argv) > 2 else "."

    servidor = ThreadingHTTPServer(
        ("", puerto),
        lambda *args, **kwargs: SinCacheHandler(
            *args, directory=directorio, **kwargs
        ),
    )
    print(f"Landing en http://localhost:{puerto} (sin caché) · Ctrl+C para parar")
    try:
        servidor.serve_forever()
    except KeyboardInterrupt:
        pass
