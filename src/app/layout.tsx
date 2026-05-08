import type { Metadata } from "next";
import AppToaster from "@/components/AppToaster";
import { ThemeProvider } from "@/components/theme-provider";
import "../styles/globals.css";

export const metadata: Metadata = {
  title: "Royal Optics",
  description: "Royal Optics - premium eyewear, sunglasses, contact lenses and accessories.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="site-bg min-h-screen antialiased">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          {children}
          <AppToaster />
        </ThemeProvider>
      </body>
    </html>
  );
}

