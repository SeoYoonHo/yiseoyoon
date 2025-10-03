
import { redirect } from 'next/navigation';

export default function HomePage() {
  // 메인 페이지는 site/home으로 리다이렉트
  redirect('/site/home');
}
