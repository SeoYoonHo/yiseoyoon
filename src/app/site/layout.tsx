import NavBar from '@/components/NavBar';
import BackgroundLayout from '@/components/BackgroundLayout';
import { BackgroundProvider } from '@/contexts/BackgroundContext';

export default function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <BackgroundProvider>
      <NavBar />
      <BackgroundLayout>
        {children}
      </BackgroundLayout>
    </BackgroundProvider>
  );
}
