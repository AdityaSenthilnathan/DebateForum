import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function ForumsForumIdPostsPostIdIndexPage() {
  const router = useRouter();
  useEffect(() => {
    // Redirect to /forum if someone lands on /forums/[forumId]/posts/[postId]
    router.replace('/forum');
  }, [router]);
  return null;
}
