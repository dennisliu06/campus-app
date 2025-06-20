import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { NotificationProvider } from "@/context/NotificationContext";

import AppWrapper from "@/components/AppWrapper";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Analytics } from "@vercel/analytics/react";
import { Toaster } from "react-hot-toast";
import GoogleAnalytics from "@/lib/GoogleAnalytics";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "2025 Campus App",
  description: "2025 Campus App”",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <GoogleAnalytics />
        <AuthProvider>
          <AppWrapper>
            <NotificationProvider>
              <Navbar />
              {children}
              <Footer />
              <Analytics />
              <Toaster position="bottom-right" />
            </NotificationProvider>
          </AppWrapper>
        </AuthProvider>
      </body>
    </html>
  );
}
