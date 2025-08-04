'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { getAuth, signOut } from 'firebase/auth';
import { User } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { collection, addDoc, query, onSnapshot, updateDoc, doc, arrayUnion, arrayRemove, getDoc, deleteDoc, where, getDocs } from 'firebase/firestore';
import { db } from '@/app/firebaseConfig';
import { NavigationBar } from '@/app/screens/ForumPage';
import { useAuth } from '@/app/authContext';

export interface Post {
  createdAt: { seconds: number };
  id: string;
  title: string;
  content: string;
  userEmail: string;
  likes: string[];
  comments: Array<{
    id: string;
    userEmail: string;
    content: string;
    createdAt: { seconds: number };
  }>;
}

export default function ForumClient({ initialPosts = [] }: { initialPosts?: Post[] }) {
  const { currentUser: authUser } = useAuth();
  
  const handleSignOut = async () => {
    try {
      await signOut();
      // Optional: Redirect to login or home page after sign out
      // router.push('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };
  const router = useRouter();
  const params = useParams();
  const { forumId } = params as { forumId: string };
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { currentUser, signOut } = useAuth();
  const [displayNames, setDisplayNames] = useState<Record<string, string>>({});
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  const [showNewPostForm, setShowNewPostForm] = useState(false);

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostTitle.trim() || !newPostContent.trim()) {
      setError('Title and content are required');
      return;
    }

    if (!currentUser) {
      setError('You must be logged in to create a post');
      return;
    }

    try {
      setLoading(true);
      await addDoc(collection(db, 'forums', forumId, 'posts'), {
        title: newPostTitle,
        content: newPostContent,
        userEmail: currentUser.email,
        likes: [],
        comments: [],
        createdAt: new Date(),
      });
      setNewPostTitle('');
      setNewPostContent('');
      setShowNewPostForm(false);
      setError('');
      // Reload the page to show the new post
      window.location.reload();
    } catch (err) {
      console.error('Error creating post:', err);
      setError('Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  // Rest of your component logic...
  // Move all the existing logic from page.tsx here
  // Make sure to update any imports and paths as needed

  return (
    <div className="min-h-screen bg-gray-100">
      <NavigationBar user={authUser} handleSignOut={handleSignOut} />
      <main className="container mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Forum: {forumId}</h1>
          <Button onClick={() => setShowNewPostForm(true)}>Create Post</Button>
        </div>

        {showNewPostForm && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Create New Post</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreatePost} className="space-y-4">
                <div>
                  <Input
                    placeholder="Post Title"
                    value={newPostTitle}
                    onChange={(e) => setNewPostTitle(e.target.value)}
                  />
                </div>
                <div>
                  <Textarea
                    placeholder="What's on your mind?"
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                    rows={4}
                  />
                </div>
                {error && <p className="text-red-500">{error}</p>}
                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowNewPostForm(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? 'Posting...' : 'Post'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="space-y-4">
          {posts.map((post) => (
            <Card key={post.id}>
              <CardHeader>
                <CardTitle>{post.title}</CardTitle>
                <p className="text-sm text-gray-500">
                  Posted by {displayNames[post.userEmail] || post.userEmail} • {post.createdAt?.seconds ? new Date(post.createdAt.seconds * 1000).toLocaleDateString() : 'Unknown date'}
                </p>
              </CardHeader>
              <CardContent>
                <p>{post.content}</p>
              </CardContent>
              <CardFooter className="flex justify-between">
              
                <Button
                  variant="ghost"
                  onClick={() => router.push(`/forum/${forumId}/posts/${post.id}`)}
                >
                  View Comments ({post.comments.length})
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
