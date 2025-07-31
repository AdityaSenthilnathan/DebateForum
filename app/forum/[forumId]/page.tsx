"use client";
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { collection, addDoc, query, onSnapshot, updateDoc, doc, arrayUnion, arrayRemove, getDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { NavigationBar } from '../../screens/ForumPage';
import { useAuth } from '../../authContext';

interface Post {
  createdAt: { seconds: number };
  id: string;
  title: string;
  content: string;
  userEmail: string;
  likes: string[];
  comments: any[];
}

export default function ForumPostsPage() {
  const router = useRouter();
  const params = useParams();
  const { forumId } = params as { forumId: string };
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { currentUser, signOut } = useAuth();

  useEffect(() => {
    if (forumId) {
      const postsRef = collection(db, 'forums', forumId, 'posts');
      const q = query(postsRef);
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const fetchedPosts = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          likes: doc.data().likes || [],
          comments: doc.data().comments || [],
        })) as Post[];
        setPosts(fetchedPosts);
      }, (error) => {
        setError('Failed to fetch posts.');
      });
      return unsubscribe;
    }
  }, [forumId]);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      setError('Failed to sign out.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <NavigationBar user={currentUser} handleSignOut={handleSignOut} />
      <div className="container mx-auto px-4 py-8">
        <h2 className="text-3xl font-bold mb-6">{forumId} Forum</h2>
        <div className="grid grid-cols-1 gap-6">
          {posts.length === 0 ? (
            <p>No posts yet. Be the first to post!</p>
          ) : (
            posts.map((post) => (
              <Card key={post.id}>
                <CardHeader>
                  <CardTitle>{post.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>{post.content}</p>
                </CardContent>
                <CardFooter>
                  <Button onClick={() => router.push(`/forum/${encodeURIComponent(forumId)}/posts/${post.id}`)}>
                    View Post
                  </Button>
                </CardFooter>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
