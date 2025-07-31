"use client";
import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { db } from '@/app/firebaseConfig';
import { doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { NavigationBar } from '../../../../screens/ForumPage';
import { useAuth } from '../../../../authContext';

// Define types
interface Comment {
  id: string;
  content: string;
  createdAt: { seconds: number };
  userEmail: string;
  replies: Comment[];
}

interface Post {
  createdAt: { seconds: number };
  id: string;
  title: string;
  content: string;
  userEmail: string;
  likes: string[];
  comments: Comment[];
}

export default function PostPage() {
  const params = useParams();
  const router = useRouter();
  const { forumId, postId } = params as { forumId: string; postId: string };
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const commentRef = useRef<HTMLTextAreaElement>(null);
  const { currentUser, signOut } = useAuth();

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const postRef = doc(db, 'forums', forumId, 'posts', postId);
        const postSnap = await getDoc(postRef);
        if (postSnap.exists()) {
          setPost({ id: postSnap.id, ...postSnap.data() } as Post);
        } else {
          setError('Post not found.');
        }
      } catch (e) {
        setError('Failed to load post.');
      }
      setLoading(false);
    };
    fetchPost();
  }, [forumId, postId]);

  const handleCommentSubmit = async () => {
    if (!commentRef.current?.value) return;
    if (!post) return;
    const newComment: Comment = {
      id: `${post.id}-${Date.now()}`,
      content: commentRef.current.value,
      createdAt: { seconds: Math.floor(Date.now() / 1000) },
      userEmail: currentUser?.displayName || currentUser?.email || 'Anonymous',
      replies: [],
    };
    try {
      const postRef = doc(db, 'forums', forumId, 'posts', postId);
      await updateDoc(postRef, { comments: arrayUnion(newComment) });
      setPost({ ...post, comments: [...post.comments, newComment] });
      commentRef.current.value = '';
    } catch (e) {
      setError('Failed to add comment.');
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      setError('Failed to sign out.');
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;
  if (!post) return <div>Post not found.</div>;

  return (
    <div className="min-h-screen bg-gray-100">
      <NavigationBar user={currentUser} handleSignOut={handleSignOut} />
      <div className="container mx-auto px-4 py-8">
        <h2 className="text-3xl font-bold mb-6 pl-5">{post.title}</h2>
        <div className="mt-4 pl-5 bg-white rounded-lg p-4 shadow-md">{post.content}</div>
        <CardFooter className="pt-4">
          <Button onClick={() => router.push(`/forum/${forumId}`)}>Back to Forum</Button>
        </CardFooter>
        <div className="mt-4 ml-8">
          <h4 className="text-lg font-semibold pb-4">Comments</h4>
          {post.comments.length === 0 ? (
            <p>There are no comments, add to the discussion!</p>
          ) :
            (
              post.comments.map((comment) => (
                <div key={comment.id} className="mb-4 p-2 bg-gray-100 rounded">
                  <p className="font-medium">{comment.userEmail}</p>
                  <p>{comment.content}</p>
                </div>
              ))
            )}
          <Textarea ref={commentRef} placeholder="Add a comment..." className="mt-2 ml-4 w-11/12" />
          <Button onClick={handleCommentSubmit} className="mt-2 ml-4">Submit Comment</Button>
          {error && <p className="text-red-500 mt-2">{error}</p>}
        </div>
      </div>
    </div>
  );
}
