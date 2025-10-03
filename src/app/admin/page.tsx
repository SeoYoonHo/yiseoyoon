import { redirect } from 'next/navigation';

export default function AdminPage() {
  // 어드민 메인 페이지는 admin/home으로 리다이렉트
  redirect('/admin/home');
}