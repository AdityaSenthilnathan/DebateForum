import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function ForumsForumIdPostsIndexPage() {
  const router = useRouter();
  useEffect(() => {
    // Redirect to /forum if someone lands on /forums/[forumId]/posts
    router.replace('/forum');
  }, [router]);
  return null;
}
