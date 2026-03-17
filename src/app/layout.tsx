import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "./providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ETBP Admin",
  description: "Enviable Transport Booking Platform — Admin Dashboard",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <script
          dangerouslySetInnerHTML={{
            __html: `window.addEventListener('error',function(e){if(e.message&&(e.message.includes('ChunkLoadError')||e.message.includes('Loading chunk')||e.message.includes('Failed to fetch dynamically imported module'))){window.location.reload();}});`,
          }}
        />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
