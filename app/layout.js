import './globals.css';

export const metadata = {
  title: 'RankJK — Exam Cutoff Predictor',
  description: 'Crowd-sourced cutoff predictor for JKSSB, SSC, JKPSC and other competitive exams. Submit your marks and discover your expected rank and cutoff.',
  keywords: 'JKSSB cutoff, SSC cutoff predictor, JKPSC expected cutoff, competitive exam rank predictor, J&K exam results',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body>{children}</body>
    </html>
  );
}
