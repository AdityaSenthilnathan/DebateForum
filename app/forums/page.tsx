"use client";

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function ForumsIndexPage() {
  const router = useRouter();
  useEffect(() => {
    // Redirect to /forum for now
    router.replace('/forum');
  }, [router]);
  return null;
}
