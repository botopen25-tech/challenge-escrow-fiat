import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ChallengeEscrow Fiat',
  description: 'A Stripe-powered social wager app without crypto.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
