/* eslint-disable @next/next/no-page-custom-font */
import "./globals.css";

export const metadata = {
  title: "PolicyEngine profiler | PolicyEngine",
  description:
    "Profile PolicyEngine simulation setup and variable calculations with a live Python backend.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://unpkg.com/@policyengine/design-system/dist/tokens.css"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
