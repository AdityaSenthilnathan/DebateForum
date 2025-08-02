"use client"

import { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { collection, addDoc, query, onSnapshot, updateDoc, doc, arrayUnion, arrayRemove, getDoc, getDocs, where, deleteDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import Link from 'next/link';
import { useAuth } from '../authContext';
import { useRouter } from 'next/navigation';
import './ForumPage.css';

interface Post {
  createdAt: { seconds: number }; // Firestore timestamp format
  id: string;
  title: string;
  content: string;
  userEmail: string;
  likes: string[]; // Array of user IDs who liked the post
  comments: Comment[]; // Array of comments
}

interface Comment {
  id: string;
  content: string;
  createdAt: { seconds: number }; // Firestore timestamp format
  userEmail: string;
  replies: Comment[]; // Array of nested comments
}

interface User {
  displayName: string | null;
  email: string | null;
  photoURL?: string | null;
  // Add other user properties as needed
}

export function NavigationBar({ user, handleSignOut }: { user: User | null, handleSignOut: () => void }) {
  // Helper to get display name
  const displayName = user?.displayName || '';
  return (
    <header className="bg-white shadow">
      <nav className="mx-auto py-4">
        <ul className="flex items-center justify-between w-full px-10">
          <img src="/favicon.png" alt="Logo" className="w-14 h-14 rounded-md" />
          <div className="flex-1 flex items-center space-x-4 pl-20">
            <Link href="/" legacyBehavior>
              <a><Button variant="ghost">Home</Button></a>
            </Link>
            <Link href="/forum" legacyBehavior>
              <a><Button variant="ghost">Forums</Button></a>
            </Link>
            <Link href="/account" legacyBehavior>
              <a><Button variant="ghost">Account</Button></a>
            </Link>
          </div>
          <span className="relative group pr-5">
            <span>{displayName}</span>
          </span>
          <Button onClick={handleSignOut} size="lg">
            Log Out
          </Button>
        </ul>
      </nav>
    </header>
  );
}

export default function DebateForum() {
  const router = useRouter()
  const [currentForum, setCurrentForum] = useState<string>('') // Forum selected
  const [posts, setPosts] = useState<Post[]>([]) // Typed posts state
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string>('h')
  const { currentUser, signOut: contextSignOut } = useAuth();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortOption, setSortOption] = useState<'newest' | 'oldest' | 'mostLiked'>('newest');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // State for selected post (for viewing or editing a single post)
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);


  const titleRef = useRef<HTMLInputElement>(null)
  const contentRef = useRef<HTMLTextAreaElement>(null)
  const commentRefs = useRef<{ [key: string]: HTMLTextAreaElement | null }>({})
  const replyRefs = useRef<{ [key: string]: HTMLTextAreaElement | null }>({})

  const handleSearch = () => {
    if (searchInputRef.current) {
      setSearchQuery(searchInputRef.current.value);
    }
  };

  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.value = searchQuery;
    }
  }, [searchQuery]);


  // Handle user sign-out
  const handleSignOut = async () => {
    try {
      await contextSignOut();
    } catch (error) {
      console.error('Error signing out:', error);
      setError('Failed to sign out. Please try again later.');
    }
  };

  // Fetch posts from Firestore when currentForum changes
  useEffect(() => {
    if (currentForum) {
      const postsRef = collection(db, 'forums', currentForum, 'posts')
      const q = query(postsRef)

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const fetchedPosts = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          likes: doc.data().likes || [], // Ensure likes is always an array
          comments: doc.data().comments || [], // Ensure comments is always an array
        })) as Post[] // Cast to Post type

        setPosts(fetchedPosts)
        console.log("Fetched posts:", fetchedPosts) // For debugging
      }, (error) => {
        console.error('Error fetching posts:', error)
        setError('Failed to fetch posts.')
      })

      return unsubscribe
    }
  }, [currentForum])

  // Handle post submission
  const handlePostSubmit = async () => {
    if (!titleRef.current?.value) {
     setError('Title is required.');
      return;
    }
    if (!contentRef.current?.value) {
      setError('Content is required.');
      return;
    }

    setLoading(true);
    try {
      const postsRef = collection(db, 'forums', currentForum, 'posts');
      await addDoc(postsRef, {
        title: titleRef.current.value,
        content: contentRef.current.value,
        createdAt: new Date(),
        userEmail: currentUser?.email || 'Anonymous',
        likes: [], // Initialize likes as an empty array
        comments: [], // Initialize comments as an empty array
      });
      titleRef.current.value = ''; // Reset title after successful submission
      contentRef.current.value = ''; // Reset content after successful submission
      setError(''); // Clear error
    } catch (error) {
      console.error('Error adding post:', error);
      setError('Failed to add the post. Please try again later.');
    }
    setLoading(false);
  }

  // Handle post like
  const handleLikePost = async (postId: string) => {
    if (!currentUser) {
      setError('You must be logged in to like a post.');
      return;
    }

    const postRef = doc(db, 'forums', currentForum, 'posts', postId);
    const post = posts.find((post) => post.id === postId);

    if (post) {
      const isLiked = post.likes.includes(currentUser.uid);
      try {
        await updateDoc(postRef, {
          likes: isLiked ? arrayRemove(currentUser.uid) : arrayUnion(currentUser.uid),
        });
        // Fetch the updated post from Firestore to ensure the state is accurate
        const updatedPostDoc = await getDoc(postRef);
        const updatedPost = { id: updatedPostDoc.id, ...updatedPostDoc.data() } as Post;
        // Update local state
        setPosts((prevPosts) =>
          prevPosts.map((p) => (p.id === postId ? updatedPost : p))
        );
        // Refresh the selected post if it is the current post
        if (selectedPost && selectedPost.id === postId) {
          setSelectedPost(updatedPost);
        }
      } catch (error) {
        console.error('Error updating likes:', error);
        setError('Failed to update likes. Please try again later.');
      }
    }
  };



  // Handle comment submission
  const handleCommentSubmit = async (postId: string, parentCommentId?: string) => {
    if (!currentUser) {
      setError('You must be logged in to comment.');
      return;
    }

    const commentContent = parentCommentId ? replyRefs.current[parentCommentId]?.value : commentRefs.current[postId]?.value;
    if (!commentContent) {
       setError('Comment content is required.');
      return;
    }

    const postRef = doc(db, 'forums', currentForum, 'posts', postId);
    const newComment = {
      id: `${postId}-${Date.now()}`, // Generate a unique ID for the comment
      content: commentContent,
      createdAt: { seconds: Math.floor(Date.now() / 1000) },
      userEmail: currentUser.displayName || currentUser.email || 'Anonymous',
      replies: [], // Initialize replies as an empty array
    };

    try {
      if (parentCommentId) {
        // Add reply to a specific comment
        const post = posts.find((post) => post.id === postId);
        if (post) {
          const parentComment = findComment(post.comments, parentCommentId);
          if (parentComment) {
            parentComment.replies.push(newComment);
            await updateDoc(postRef, {
              comments: post.comments,
            });
            // Update local state
            setPosts((prevPosts) =>
              prevPosts.map((p) =>
                p.id === postId ? { ...p, comments: [...p.comments] } : p
              )
            );
            // Refresh the selected post if it is the current post
            if (selectedPost && selectedPost.id === postId) {
              setSelectedPost({
                ...selectedPost,
                comments: [...selectedPost.comments],
              });
            }
            console.log('Reply added:', newComment);
          }
        }
      } else {
        // Add comment to the post
        await updateDoc(postRef, {
          comments: arrayUnion(newComment),
        });
        // Update local state
        setPosts((prevPosts) =>
          prevPosts.map((p) =>
            p.id === postId ? { ...p, comments: [...p.comments, newComment] } : p
          )
        );
        // Refresh the selected post if it is the current post
        if (selectedPost && selectedPost.id === postId) {
          setSelectedPost({
            ...selectedPost,
            comments: [...selectedPost.comments, newComment],
          });
        }
        console.log('Comment added:', newComment);
      }
      if (parentCommentId) {
        if (replyRefs.current[parentCommentId]) {
          replyRefs.current[parentCommentId]!.value = ''; // Reset reply after successful submission
        }
      } else {
        if (commentRefs.current[postId]) {
          commentRefs.current[postId]!.value = ''; // Reset comment after successful submission
        }
      }
      setError(''); // Clear error
    } catch (error) {
      console.error('Error adding comment:', error);
      setError('Failed to add the comment. Please try again later.');
    }
  };

  // Find a comment by ID
  const findComment = (comments: Comment[], commentId: string): Comment | null => {
    for (const comment of comments) {
      if (comment.id === commentId) {
        return comment
      }
      const found = findComment(comment.replies, commentId)
      if (found) {
        return found
      }
    }
    return null
  }

  const getUserName = async (email: string) => {
    const userQuery = query(collection(db, 'users'), where('email', '==', email));
    const querySnapshot = await getDocs(userQuery);
    if (!querySnapshot.empty) {
      return querySnapshot.docs[0].data().displayName;
    }
    return email;
  };

  // Helper hook to get display name from email
  const useUserName = (email: string) => {
    const [userName, setUserName] = useState<string>(email);
    useEffect(() => {
      const fetchUserName = async () => {
        const userQuery = query(collection(db, 'users'), where('email', '==', email));
        const querySnapshot = await getDocs(userQuery);
        if (!querySnapshot.empty) {
          setUserName(querySnapshot.docs[0].data().displayName);
        } else {
          setUserName(email);
        }
      };
      fetchUserName();
    }, [email]);
    return userName;
  };

  // Handle forum selection and navigation
  const handleForumNavigation = (forum: string) => {
    if (forum) {
      setCurrentForum(forum)
      router.push('/forum')
    } else {
      console.error('No valid forum selected.')
    }
  }

  // Handle post deletion
  const handleDeletePost = async (postId: string) => {
    if (!currentUser) {
      setError('You must be logged in to delete a post.');
      return;
    }
  
    const confirmDelete = window.confirm('Are you sure you want to delete this post? This action cannot be undone.');
    if (!confirmDelete) return;
  
    const postRef = doc(db, 'forums', currentForum, 'posts', postId);
    try {
      await deleteDoc(postRef);
      setPosts((prevPosts) => prevPosts.filter((post) => post.id !== postId));
      setSelectedPost(null);
    } catch (error) {
      console.error('Error deleting post:', error);
      setError('Failed to delete the post. Please try again later.');
    }
  };
  
  // Handle comment deletion
  const handleDeleteComment = async (postId: string, commentId: string) => {
    if (!currentUser) {
      setError('You must be logged in to delete a comment.');
      return;
    }
  
    const confirmDelete = window.confirm('Are you sure you want to delete this comment? This action cannot be undone.');
    if (!confirmDelete) return;
  
    const postRef = doc(db, 'forums', currentForum, 'posts', postId);
    const post = posts.find((post) => post.id === postId);
  
    if (post) {
      const updatedComments = deleteComment(post.comments, commentId);
      try {
        await updateDoc(postRef, { comments: updatedComments });
        setPosts((prevPosts) =>
          prevPosts.map((p) => (p.id === postId ? { ...p, comments: updatedComments } : p))
        );
        if (selectedPost && selectedPost.id === postId) {
          setSelectedPost({ ...selectedPost, comments: updatedComments });
        }
      } catch (error) {
        console.error('Error deleting comment:', error);
        setError('Failed to delete the comment. Please try again later.');
      }
    }
  };
  
  // Recursive function to delete a comment and its replies
  const deleteComment = (comments: Comment[], commentId: string): Comment[] => {
    return comments.filter((comment) => {
      if (comment.id === commentId) return false;
      comment.replies = deleteComment(comment.replies, commentId);
      return true;
    });
  };
  

  // Filter and sort posts
  const filteredPosts = posts
    .filter((post) => post.title.toLowerCase().includes(searchQuery.toLowerCase()) || post.content.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      switch (sortOption) {
        case 'newest':
          return b.createdAt.seconds - a.createdAt.seconds;
        case 'oldest':
          return a.createdAt.seconds - b.createdAt.seconds;
        case 'mostLiked':
          return b.likes.length - a.likes.length;
        default:
          return 0;
      }
    });

  return (
    <div className="min-h-screen bg-gray-100">
      <NavigationBar user={currentUser} handleSignOut={handleSignOut} />
      <main>
        {/* Home page content */}
        <section className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-5xl font-extrabold mb-6">Welcome to DebateHub</h1>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Elevate your debate skills, connect with peers, and explore diverse perspectives in a vibrant community of high school debaters.
          </p>
          <img src="/logo.png" alt="DebateHub Logo" className="mx-auto w-48 h-48 rounded-lg shadow-lg mb-8" />
          <div className="flex justify-center gap-4">
            <Link href="/forum" legacyBehavior>
              <a><Button size="lg">Explore Forums</Button></a>
            </Link>
            <Link href="/account" legacyBehavior>
              <a><Button size="lg" variant="outline">My Account</Button></a>
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}