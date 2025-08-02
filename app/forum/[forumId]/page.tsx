"use client";
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { collection, addDoc, query, onSnapshot, updateDoc, doc, arrayUnion, arrayRemove, getDoc, deleteDoc, where, getDocs } from 'firebase/firestore';
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
  comments: Array<{
    id: string;
    userEmail: string;
    content: string;
    createdAt: { seconds: number };
  }>;
}

export default function ForumPostsPage() {
  const router = useRouter();
  const params = useParams();
  const { forumId } = params as { forumId: string };
  const [posts, setPosts] = useState<Post[]>([]);
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

    setLoading(true);
    try {
      await addDoc(collection(db, 'forums', forumId, 'posts'), {
        title: newPostTitle,
        content: newPostContent,
        userEmail: currentUser.email,
        createdAt: new Date(),
        likes: [],
        comments: []
      });
      setNewPostTitle('');
      setNewPostContent('');
      setShowNewPostForm(false);
      setError('');
    } catch (err) {
      console.error('Error creating post:', err);
      setError('Failed to create post');
    }
    setLoading(false);
  };

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

  useEffect(() => {
    // Fetch display names for all unique emails in posts
    const fetchDisplayNames = async () => {
      const emails = Array.from(new Set(posts.map((post) => post.userEmail)));
      const newDisplayNames: { [email: string]: string } = {};
      for (const email of emails) {
        if (displayNames[email]) {
          newDisplayNames[email] = displayNames[email];
          continue;
        }
        const userQuery = query(collection(db, 'users'), where('email', '==', email));
        const querySnapshot = await getDocs(userQuery);
        if (!querySnapshot.empty) {
          newDisplayNames[email] = querySnapshot.docs[0].data().displayName;
        } else {
          newDisplayNames[email] = email;
        }
      }
      setDisplayNames((prev) => ({ ...prev, ...newDisplayNames }));
    };
    if (posts.length > 0) fetchDisplayNames();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [posts]);

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
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold">{forumId} Forum</h2>
          <Button 
            onClick={() => setShowNewPostForm(!showNewPostForm)}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {showNewPostForm ? 'Cancel' : 'Create New Post'}
          </Button>
        </div>

        {showNewPostForm && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Create New Post</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreatePost}>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="postTitle" className="block text-sm font-medium text-gray-700 mb-1">
                      Title
                    </label>
                    <Input
                      id="postTitle"
                      value={newPostTitle}
                      onChange={(e) => setNewPostTitle(e.target.value)}
                      placeholder="Enter post title"
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label htmlFor="postContent" className="block text-sm font-medium text-gray-700 mb-1">
                      Content
                    </label>
                    <Textarea
                      id="postContent"
                      value={newPostContent}
                      onChange={(e) => setNewPostContent(e.target.value)}
                      placeholder="What would you like to discuss?"
                      rows={4}
                      className="w-full"
                    />
                  </div>
                  {error && <p className="text-red-500 text-sm">{error}</p>}
                  <div className="flex justify-end space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowNewPostForm(false)}
                      disabled={loading}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={loading}>
                      {loading ? 'Posting...' : 'Post'}
                    </Button>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
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
                <CardFooter style={{ padding: '1rem'}}>
                    <div className="w-full flex items-center justify-between">
                        <p className="text-sm text-gray-500 pl-2">Posted by: {displayNames[post.userEmail] || post.userEmail}</p>
                        <Button onClick={() => router.push(`/forum/${encodeURIComponent(forumId)}/posts/${post.id}`)}>
                            View Post
                        </Button>
                    </div>
                </CardFooter>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
