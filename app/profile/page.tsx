"use client";
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function ProfileIndexPage() {
  const router = useRouter();
  useEffect(() => {
    // Redirect to home or show a message
    router.replace('/');
  }, [router]);
  return null;
}
