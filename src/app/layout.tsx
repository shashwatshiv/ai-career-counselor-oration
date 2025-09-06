import { Inter } from "next/font/google";
import "./globals.css";
import { ProviderApp } from "@/lib/trpc/provider";
import { AuthSessionProvider } from "@/components/providers/SessionProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";
const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Career Counselor AI",
  description: "Get personalized career guidance powered by AI",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider>
          <AuthSessionProvider session={session}>
            <ProviderApp>{children}</ProviderApp>
          </AuthSessionProvider>
        </ThemeProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
