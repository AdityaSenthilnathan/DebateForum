"use client"

import { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { collection, addDoc, query, onSnapshot, updateDoc, doc, arrayUnion, arrayRemove, getDoc, getDocs, where, deleteDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import Link from 'next/link';
import { useAuth } from '../authContext';
import { useRouter } from 'next/navigation';
import './ForumPage.css';
import Image from 'next/image';

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
  const [isOpen, setIsOpen] = useState(false);
  const displayName = user?.displayName || user?.email || 'Guest';
  const [isMobile, setIsMobile] = useState(false);

  // Check if the screen is mobile size
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768); // md breakpoint
    };
    
    // Set initial value
    checkIfMobile();
    
    // Add event listener
    window.addEventListener('resize', checkIfMobile);
    
    // Clean up
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  // Navigation links for the left side (on desktop)
  const leftNavLinks = (
    <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-4">
      <Link href="/" legacyBehavior>
        <a className="w-full md:w-auto"><Button variant="ghost" className="w-full md:w-auto justify-start">Home</Button></a>
      </Link>
      <Link href="/forum" legacyBehavior>
        <a className="w-full md:w-auto"><Button variant="ghost" className="w-full md:w-auto justify-start">Forums</Button></a>
      </Link>
      <Link href="/account" legacyBehavior>
        <a className="w-full md:w-auto"><Button variant="ghost" className="w-full md:w-auto justify-start">Account</Button></a>
      </Link>
    </div>
  );

  // User info and logout button for the right side (on desktop)
  const rightNavContent = (
    <div className="hidden md:flex items-center space-x-4">
      <span className="text-sm font-medium text-gray-700">
        {displayName}
      </span>
      <Button onClick={handleSignOut} variant="outline" size="sm">
        Log Out
      </Button>
    </div>
  );

  // Mobile menu content
  const mobileNavContent = (
    <div className="flex flex-col space-y-4">
      {leftNavLinks}
      <div className="w-full border-t border-gray-200 my-2"></div>
      <div className="flex items-center justify-between w-full">
        <span className="text-sm font-medium">{displayName}</span>
        <Button onClick={handleSignOut} size="sm" className="w-auto">
          Log Out
        </Button>
      </div>
    </div>
  );

  return (
    <header className="bg-white shadow sticky top-0 z-50">
      <nav className="container mx-auto py-4 px-4 md:px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Image 
              src="/favicon.png" 
              alt="Logo" 
              className="w-12 h-12 md:w-14 md:h-14 rounded-md" 
              width={56} 
              height={56} 
              priority
            />
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex flex-1 items-center justify-between px-10">
            {leftNavLinks}
            {rightNavContent}
          </div>
          
          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={toggleMenu}
              className="text-gray-500 hover:text-gray-900 focus:outline-none"
              aria-label="Toggle menu"
            >
              {!isOpen ? (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                </svg>
              ) : (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </button>
          </div>
        </div>
        
        {/* Mobile Navigation */}
        <div className={`md:hidden ${isOpen ? 'block' : 'hidden'} mt-4`}>
          {mobileNavContent}
        </div>
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
  //   <div className="container mx-auto px-4 py-8 ">
  //   <div className="absolute inset-0 bg-gradient-to-r from-red-600 to-red-100 opacity-60 -z-10"></div>

  //   {/* Content on top */}
  //   <div className="overflow-hidden">
  //     <div className="mx-auto max-w-7xl px-6 pb-32 pt-36 sm:pt-60 lg:px-8 lg:pt-16">
  //       <div className="mx-auto max-w-2xl gap-x-14 lg:mx-0 lg:flex lg:max-w-none lg:items-center">
  //         {/* Text Content */}
  //         <div className="text-center lg:text-left">
  //           {user ? (
  //             <>
  //               <p className='pb-5 '>
  //                 Hello,
  //                 <span className="relative group pl-1">
  //                   <span>{user.displayName}</span>
  //                   <span className="absolute left-0 bottom-full mb-1 w-max p-1 text-xs text-white bg-black rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-500">
  //                     {user.email}
  //                   </span>
  //                 </span>
  //                 !
  //               </p>
  //             </>
  //           ) : (<></>)}
  //           <h2 className="text-5xl font-extrabold text-black mb-6">Welcome to DebateHub</h2>
  //           <p className="text-xl text-black-200 mb-8 max-w-2xl mx-auto">
  //             Elevate your debate skills, connect with peers, and explore diverse perspectives
  //             in a vibrant community of high school debaters.
  //           </p>
  //         </div>

  //         {/* Image Content */}
  //         <div className="lg:flex-shrink-0 lg:w-1/2">
  //         <img
  //             className="w-full object-cover rounded-lg shadow-lg"
  //             src="./logo.png"
  //             alt="Debate illustration"
  //           />
  //         </div>
  //       </div>
  //     </div>
  //   </div>
    

  //   <div className="mt-8 text-center">
  //     {user ? (
  //       <>

  //         <Button onClick={() => navigateTo('forums')} size="lg">
  //           Explore Forums
  //         </Button>
  //         <div className="mt-4">
  //           <p className="text-center pt-">Made by Aditya Senthilnathan</p>
  //         </div>
  //       </>
  //     ) : (
  //       <>
  //         <Button onClick={() => navigateTo('forums')} size="lg">
  //           Explore Forums
  //         </Button>
  //       </>
  //     )}
  //   </div>
  // </div>
    <div className="min-h-screen bg-gray-100">
      <NavigationBar user={currentUser} handleSignOut={handleSignOut} />
      <main>
        {/* Home page content */}
        <section className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-5xl font-extrabold mb-6">Welcome to DebateHub</h1>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Elevate your debate skills, connect with peers, and explore diverse perspectives in a vibrant community of high school debaters.
          </p>
          <Image src="/logo.png" alt="DebateHub Logo" className="mx-auto rounded-lg shadow-lg mb-8" width={600} height={400} />
          <div className="container mx-auto px-4 py-12 pb-0">
      <section className="grid md:grid-cols-3 gap-8 mb-16">
        <div className="bg-white rounded-lg shadow-lg p-6 text-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-12 w-12 text-red-500 mx-auto mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path d="M.5 200V.5H200" fill="none" />
          </svg>
          <h3 className="text-2xl font-semibold text-red-900 mb-6">Engage in Discussions</h3>
          <p className="text-gray-600">
            Participate in thought-provoking debates on various topics and formats.
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-lg p-6 text-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-12 w-12 text-red-500 mx-auto mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
            />
          </svg>
          <h3 className="text-2xl font-semibold text-red-900 mb-6">Improve Your Skills</h3>
          <p className="text-gray-600">
            Learn from peers, share strategies, and refine your argumentation techniques.
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-lg p-6 text-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-12 w-12 text-red-500 mx-auto mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
          <h3 className="text-2xl font-semibold text-red-900 mb-6">Build Connections</h3>
          <p className="text-gray-600">
            Network with fellow debaters and form lasting friendships in the community.
          </p>
        </div>
      </section>

      {/* Section explaining DebateHub */}
      <section className="bg-red-50 rounded-xl p-8 mb-16 shadow-lg">
        <h2 className="text-3xl font-bold text-red-900 mb-6">What is DebateHub?</h2>
        <div className="text-gray-700 space-y-4">
          <p>
            DebateHub is a dynamic online platform designed specifically for high school debaters
            who are passionate about honing their skills and engaging in meaningful discussions.
            Our community-driven forum provides a space where students can connect, learn, and
            grow without the need for formal coaching or mentoring.
          </p>
          <ul className="list-disc list-inside space-y-2">
            <li>Participate in a wide range of debates and discussions</li>
            <li>Enhance your debating abilities with interactive resources</li>
            <li>Join a supportive network of like-minded debaters</li>
          </ul>
        </div>
      </section>
    </div>
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