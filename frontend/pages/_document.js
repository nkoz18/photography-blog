import Document, { Html, Head, Main, NextScript } from "next/document"

class MyDocument extends Document {
  render() {
    return (
      <Html>
        <Head>
          {/* Dark mode flash prevention script - runs immediately */}
          <script
            dangerouslySetInnerHTML={{
              __html: `
                (function() {
                  try {
                    // Check saved preference first
                    const savedMode = localStorage.getItem('darkMode');
                    let isDarkMode = false;
                    
                    if (savedMode !== null) {
                      isDarkMode = savedMode === 'true';
                    } else if (window.matchMedia) {
                      // Check system preference
                      isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
                    }
                    
                    if (isDarkMode) {
                      document.documentElement.classList.add('dark-mode');
                      document.body.classList.add('dark-mode');
                    }
                  } catch (e) {
                    // Fail silently
                  }
                })();
              `
            }}
          />
          
          {/* Favicon links */}
          <link rel="apple-touch-icon" sizes="57x57" href="/apple-icon-57x57.png" />
          <link rel="apple-touch-icon" sizes="60x60" href="/apple-icon-60x60.png" />
          <link rel="apple-touch-icon" sizes="72x72" href="/apple-icon-72x72.png" />
          <link rel="apple-touch-icon" sizes="76x76" href="/apple-icon-76x76.png" />
          <link rel="apple-touch-icon" sizes="114x114" href="/apple-icon-114x114.png" />
          <link rel="apple-touch-icon" sizes="120x120" href="/apple-icon-120x120.png" />
          <link rel="apple-touch-icon" sizes="144x144" href="/apple-icon-144x144.png" />
          <link rel="apple-touch-icon" sizes="152x152" href="/apple-icon-152x152.png" />
          <link rel="apple-touch-icon" sizes="180x180" href="/apple-icon-180x180.png" />
          <link rel="icon" type="image/png" sizes="192x192" href="/android-icon-192x192.png" />
          <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
          <link rel="icon" type="image/png" sizes="96x96" href="/favicon-96x96.png" />
          <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
          <link rel="manifest" href="/manifest.json" />
          <meta name="msapplication-TileColor" content="#ff007f" />
          <meta name="msapplication-TileImage" content="/ms-icon-144x144.png" />
          <meta name="theme-color" content="#ff007f" />
          
          {/* eslint-disable-next-line */}
          <link
            rel="stylesheet"
            href="https://fonts.googleapis.com/css?family=Arvo|Lato"
          />
          {/* Added Google Fonts - Barriecito, Kirang Haerang, Bangers, and IBM Plex Mono */}
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link
            rel="preconnect"
            href="https://fonts.gstatic.com"
            crossOrigin="true"
          />
          <link
            href="https://fonts.googleapis.com/css2?family=Barriecito&family=Bangers&family=IBM+Plex+Mono&family=Kirang+Haerang&display=swap&family=Permanent+Marker&display=swap"
            rel="stylesheet"
          />
          <link
            rel="stylesheet"
            href="https://cdn.jsdelivr.net/npm/uikit@3.2.3/dist/css/uikit.min.css"
          />
          <script
            async
            src="https://cdnjs.cloudflare.com/ajax/libs/uikit/3.2.0/js/uikit.min.js"
          />
          <script
            async
            src="https://cdn.jsdelivr.net/npm/uikit@3.2.3/dist/js/uikit-icons.min.js"
          />
          <script
            async
            src="https://cdnjs.cloudflare.com/ajax/libs/uikit/3.2.0/js/uikit.js"
          />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    )
  }
}

export default MyDocument