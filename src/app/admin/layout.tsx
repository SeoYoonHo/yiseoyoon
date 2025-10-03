import AdminNavBar from '@/components/AdminNavBar';
import { BackgroundProvider } from '@/contexts/BackgroundContext';

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <BackgroundProvider>
      <div className="min-h-screen bg-gray-50">
        {/* 어드민 전용 네비게이션 바만 표시 */}
        <AdminNavBar />
        
        {/* 어드민 컨텐츠 */}
        <div className="pt-16">
          {children}
        </div>
      </div>
    </BackgroundProvider>
  );
}
