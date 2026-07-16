import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

export const metadata: Metadata = {
  title: '상품 검색 비활성화',
  description: '현재 상품 검색 페이지는 제공하지 않습니다.',
  robots: { index: false, follow: false },
};

export default function CoupangPage() {
  notFound();
}
