import { createRootRoute, Outlet, Link, type NotFoundRouteProps } from "@tanstack/react-router";
import { Meta, Scripts } from "@tanstack/start";
import { ClerkProvider, SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/tanstack-start";
import "../styles/globals.css";
import "../styles/board.css";

function NotFound(_: NotFoundRouteProps) {
  return (
    <div style={{ textAlign: "center", padding: "6rem 1rem" }}>
      <h1 style={{ fontSize: "4rem", marginBottom: "1rem" }}>404</h1>
      <p className="muted" style={{ marginBottom: "2rem" }}>Página no encontrada.</p>
      <Link to="/" className="btn btn-gold">Volver al inicio</Link>
    </div>
  );
}

export const Route = createRootRoute({
  component: RootLayout,
  notFoundComponent: NotFound,
});

function RootLayout() {
  return (
    <html lang="es">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Damas PvE — Entrena tu mente, vence a la máquina</title>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <Meta />
      </head>
      <body>
        <script
          dangerouslySetInnerHTML={{
            __html:
              `(function(){var s=document.createElement('script');` +
              `s.type='module';` +
              `s.textContent='(async()=>{try{const m=await import("/@react-refresh");m.injectIntoGlobalHook(window)}catch(e){}window.$RefreshReg$=()=>{};window.$RefreshSig$=()=>(t)=>t;window.__vite_plugin_react_preamble_installed__=true;await import("/_build/src/client.tsx")})()';` +
              `document.head.appendChild(s)})()`
          }}
        />
        <ClerkProvider>
          <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
            <nav className="nav">
              <div className="nav-inner">
                <Link to="/" className="brand" aria-label="Damas — inicio">
                  <span className="brand-mark" />
                  <span className="brand-name">
                    Da<b>mas</b>
                  </span>
                </Link>

                <div className="nav-links">
                  <Link to="/play" className="nav-link" activeProps={{ className: "nav-link active" }}>
                    Jugar
                  </Link>
                  <Link to="/leaderboard" className="nav-link" activeProps={{ className: "nav-link active" }}>
                    Ranking
                  </Link>
                  <Link to="/shop" className="nav-link" activeProps={{ className: "nav-link active" }}>
                    Tienda
                  </Link>
                  <SignedIn>
                    <Link to="/me" className="nav-link" activeProps={{ className: "nav-link active" }}>
                      Perfil
                    </Link>
                  </SignedIn>
                </div>

                <div className="nav-right">
                  <SignedIn>
                    <Link to="/play" className="btn btn-gold btn-sm">
                      Nueva partida
                    </Link>
                    <UserButton afterSignOutUrl="/" />
                  </SignedIn>
                  <SignedOut>
                    <SignInButton mode="modal">
                      <button className="btn btn-gold btn-sm">Iniciar sesión</button>
                    </SignInButton>
                  </SignedOut>
                </div>
              </div>
            </nav>

            <main style={{ flex: 1 }}>
              <Outlet />
            </main>

            <footer className="footer">
              <div className="footer-inner">
                <span>Damas PvE — entrena tu mente, vence a la máquina.</span>
                <span className="muted-2">© {new Date().getFullYear()}</span>
              </div>
            </footer>
          </div>
        </ClerkProvider>
        <Scripts />
      </body>
    </html>
  );
}
