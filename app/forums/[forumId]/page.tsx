"use client";
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function ForumsForumIdIndexPage() {
  const router = useRouter();
  useEffect(() => {
    // Redirect to /forum if someone lands on /forums/[forumId]
    router.replace('/forum');
  }, [router]);
  return null;
}
