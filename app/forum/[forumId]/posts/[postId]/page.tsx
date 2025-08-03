"use client";
import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { db } from '@/app/firebaseConfig';
import { doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { NavigationBar } from '@/app/screens/ForumPage';
import { useAuth } from '@/app/authContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/DropdownMenu';

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
  const [displayNames, setDisplayNames] = useState<{ [email: string]: string }>({});
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState<{ [commentId: string]: string }>({});
  const [openMenu, setOpenMenu] = useState<string | null>(null);

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

  useEffect(() => {
    // Fetch display names for all unique emails in comments
    if (!post) return;
    const fetchDisplayNames = async () => {
      const emails = Array.from(new Set(post.comments.map((c) => c.userEmail)));
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
    if (post.comments.length > 0) fetchDisplayNames();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [post]);

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

  const handleDeleteComment = async (commentId: string) => {
    if (!post) return;
    if (!currentUser) return;
    // Recursive function to delete a comment and its replies
    const deleteCommentRecursive = (commentsArr: Comment[]): Comment[] =>
      commentsArr.filter((comment) => {
        if (comment.id === commentId) return false;
        comment.replies = deleteCommentRecursive(comment.replies);
        return true;
      });
    const updatedComments = deleteCommentRecursive(post.comments);
    const postRef = doc(db, 'forums', forumId, 'posts', postId);
    await updateDoc(postRef, { comments: updatedComments });
    setPost(post => post ? { ...post, comments: updatedComments } : post);
  };

  // Helper to recursively render comments and their replies
  const renderComments = (comments: Comment[], parentId: string | null = null) => {
    return comments.map((comment) => (
      <div key={comment.id} style={{ marginLeft: parentId ? 32 : 0, marginTop: 12, borderLeft: parentId ? '2px solid #eee' : undefined, paddingLeft: parentId ? 16 : 0 }}>
        <div className="mb-1 flex items-center gap-2">
          <span className="font-medium">{comment.userEmail}</span>
          <span className="ml-2 text-gray-600 text-xs">{new Date(comment.createdAt.seconds * 1000).toLocaleString()}</span>
          {currentUser && (currentUser.displayName === comment.userEmail || currentUser.email === comment.userEmail) && (
            <DropdownMenu>
              <DropdownMenuTrigger onClick={() => setOpenMenu(openMenu === comment.id ? null : comment.id)}>
                <svg width="20" height="20" fill="black" viewBox="0 0 24 24"><circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/></svg>
              </DropdownMenuTrigger>
              <DropdownMenuContent show={openMenu === comment.id}>
                <DropdownMenuItem onClick={() => { handleDeleteComment(comment.id); setOpenMenu(null); }}>
                  <span className="text-red-600">Delete</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        <div style={{paddingLeft: 12}}>{comment.content}</div>
        <div className="flex gap-2 mt-1">
          <Button size="sm" variant="ghost" onClick={() => setReplyingTo(comment.id)}>Reply</Button>
        </div>
        {replyingTo === comment.id && (
          <div className="mt-2">
            <Textarea
              value={replyContent[comment.id] || ''}
              onChange={e => setReplyContent(rc => ({ ...rc, [comment.id]: e.target.value }))}
              placeholder="Write a reply..."
              className="w-full mb-2"
            />
            <Button
              size="sm"
              onClick={async () => {
                if (!replyContent[comment.id]) return;
                if (!post) return;
                // Add reply to Firestore
                const addReply = (commentsArr: Comment[]): Comment[] =>
                  commentsArr.map(c => {
                    if (c.id === comment.id) {
                      return {
                        ...c,
                        replies: [
                          ...c.replies,
                          {
                            id: `${comment.id}-reply-${Date.now()}`,
                            content: replyContent[comment.id],
                            createdAt: { seconds: Math.floor(Date.now() / 1000) },
                            userEmail: currentUser?.displayName || currentUser?.email || 'Anonymous',
                            replies: [],
                          },
                        ],
                      };
                    } else {
                      return { ...c, replies: addReply(c.replies) };
                    }
                  });
                const updatedComments = addReply(post.comments);
                const postRef = doc(db, 'forums', forumId, 'posts', postId);
                await updateDoc(postRef, { comments: updatedComments });
                setPost(post => post ? { ...post, comments: updatedComments } : post);
                setReplyingTo(null);
                setReplyContent(rc => ({ ...rc, [comment.id]: '' }));
              }}
            >
              Submit Reply
            </Button>
            <Button size="sm" variant="outline" className="ml-2" onClick={() => setReplyingTo(null)}>Cancel</Button>
          </div>
        )}
        {/* Render replies recursively */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-2">
            {renderComments(comment.replies, comment.id)}
          </div>
        )}
      </div>
    ));
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
        <div className="mt-4 ml-8 pl-6 py-4 bg-white rounded-lg shadow border">
          
          {post.comments.length === 0 ? (
            <p>There are no comments, add to the discussion!</p>
          ) : (
            renderComments(post.comments)
          )}
          <Textarea ref={commentRef} placeholder="Add a comment..." className="mt-2 ml-4 w-11/12" />
          <Button onClick={handleCommentSubmit} className="mt-2 ml-4">Submit Comment</Button>
          {error && <p className="text-red-500 mt-2">{error}</p>}
        </div>
      </div>
    </div>
  );
}
