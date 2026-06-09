import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'TurnOrder.App — Race to the Draft Order',
  description: 'Settle the order. Start the race.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
