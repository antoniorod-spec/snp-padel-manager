export const metadata = {
  title: "SNP Padel Manager",
  description: "Gestor de partidos Series Nacionales de Pádel",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0F172A",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <head>
        <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ctext y='.9em' font-size='90'%3E%F0%9F%8F%86%3C/text%3E%3C/svg%3E" />
      </head>
      <body style={{ margin: 0, padding: 0, WebkitFontSmoothing: "antialiased", MozOsxFontSmoothing: "grayscale" }}>
        {children}
      </body>
    </html>
  );
}
