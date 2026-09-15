import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'space.domeqserver001.dragonmind',
  appName: 'Dragon Mind',
  webDir: 'www',
  server: {
    // Allows the WebView to make HTTPS calls to your live API domain.
    // cleartext is left off since we're on https:// end to end via the
    // Cloudflare tunnel - no http:// traffic anywhere.
    androidScheme: 'https',
  },
};

export default config;
