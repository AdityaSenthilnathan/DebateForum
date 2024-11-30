"use client"

import '../globals.css'
import { useState, useEffect, useRef } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { collection, addDoc, query, onSnapshot, updateDoc, doc, arrayUnion, arrayRemove, getDoc, setDoc, where, getDocs } from 'firebase/firestore'
import { db, auth } from '../firebaseConfig'
import { signOut, onAuthStateChanged, User } from 'firebase/auth'

import './ForumPage.css'; // Import the CSS file for curved lines
//import Link from 'next/link';
import { MessageCircle, TrendingUp } from "lucide-react"
import { ThumbsUp } from "lucide-react"
interface Post {
  id: string;
  title: string;
  content: string;
  createdAt: { seconds: number }; // Firestore timestamp format
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

export default function DebateForum() {
  const [currentPage, setCurrentPage] = useState<string>('home')
  const [currentForum, setCurrentForum] = useState<string>('') // Forum selected
  const [posts, setPosts] = useState<Post[]>([]) // Typed posts state
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string>('')
  const [user, setUser] = useState<User | null>(null) // User authentication state
  const [selectedPost, setSelectedPost] = useState<Post | null>(null); // State to hold the selected post
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortOption, setSortOption] = useState<string>('newest');
  const searchInputRef = useRef<HTMLInputElement>(null);


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


  // Fetch the user authentication status on mount
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        if (!user.emailVerified) {
          await signOut(auth);
          setError('Please verify your email before accessing the forum.');
          setUser(null);
          return;
        }
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          setUser({ ...user, displayName: userDoc.data().displayName, email: user.email });
        } else {
          const displayName = user.displayName ;
          await setDoc(userDocRef, { displayName, email: user.email });
          setUser({ ...user, displayName, email: user.email });
        }
      } else {
        setUser(null);
      }
    });
    return unsubscribe; // Cleanup on component unmount
  }, [])

  // Handle user sign-out
  const handleSignOut = async () => {
    try {
      await signOut(auth)
    } catch (error) {
      console.error('Error signing out:', error)
      setError('Failed to sign out. Please try again later.')
    }
  }

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
      if (currentPage === 'forum') setError('Title is required.');
      return;
    }
    if (!contentRef.current?.value) {
      if (currentPage === 'forum') setError('Content is required.');
      return;
    }

    setLoading(true);
    try {
      const postsRef = collection(db, 'forums', currentForum, 'posts');
      await addDoc(postsRef, {
        title: titleRef.current.value,
        content: contentRef.current.value,
        createdAt: new Date(),
        userEmail: user?.email || 'Anonymous',
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
    if (!user) {
      setError('You must be logged in to like a post.');
      return;
    }

    const postRef = doc(db, 'forums', currentForum, 'posts', postId);
    const post = posts.find((post) => post.id === postId);

    if (post) {
      const isLiked = post.likes.includes(user.uid);
      try {
        await updateDoc(postRef, {
          likes: isLiked ? arrayRemove(user.uid) : arrayUnion(user.uid),
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
    if (!user) {
      setError('You must be logged in to comment.');
      return;
    }

    const commentContent = parentCommentId ? replyRefs.current[parentCommentId]?.value : commentRefs.current[postId]?.value;
    if (!commentContent) {
      if (currentPage === 'post') setError('Comment content is required.');
      return;
    }

    const postRef = doc(db, 'forums', currentForum, 'posts', postId);
    const newComment = {
      id: `${postId}-${Date.now()}`, // Generate a unique ID for the comment
      content: commentContent,
      createdAt: { seconds: Math.floor(Date.now() / 1000) },
      userEmail: user?.email || 'Anonymous',
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

  const useUserName = (email: string) => {
    const [userName, setUserName] = useState<string>(email);

    useEffect(() => {
      const fetchUserName = async () => {
        const name = await getUserName(email);
        setUserName(name);
      };
      fetchUserName();
    }, [email]);

    return userName;
  };

  // Handle navigation between pages
  const navigateTo = (page: string, post?: Post) => {
    setSelectedPost(post || null);
    setError(''); // Clear error when navigating to a new page
    setCurrentPage(page);
  }

  // Handle forum selection and navigation
  const handleForumNavigation = (forum: string) => {
    if (forum) {
      setCurrentForum(forum)
      navigateTo('forum')
    } else {
      console.error('No valid forum selected.')
    }
  }

  // Home page UI
  const HomePage = () => (
    <div className="container mx-auto px-4 py-8 ">
      <div className="absolute inset-0 bg-gradient-to-r from-red-600 to-red-100 opacity-60 -z-10"></div>

      {/* Content on top */}
      <div className="overflow-hidden">
        <div className="mx-auto max-w-7xl px-6 pb-32 pt-36 sm:pt-60 lg:px-8 lg:pt-16">
          <div className="mx-auto max-w-2xl gap-x-14 lg:mx-0 lg:flex lg:max-w-none lg:items-center">
            {/* Text Content */}
            <div className="text-center lg:text-left">
              {user ? (
                <>
                  <p className='pb-5 '>
                    Hello,
                    <span className="relative group pl-1">
                      <span>{user.displayName}</span>
                      <span className="absolute left-0 bottom-full mb-1 w-max p-1 text-xs text-white bg-black rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-500">
                        {user.email}
                      </span>
                    </span>
                    !
                  </p>
                </>
              ) : (<></>)}
              <h2 className="text-5xl font-extrabold text-black mb-6">Welcome to DebateHub</h2>
              <p className="text-xl text-black-200 mb-8 max-w-2xl mx-auto">
                Elevate your debate skills, connect with peers, and explore diverse perspectives
                in a vibrant community of high school debaters.
              </p>
            </div>

            {/* Image Content */}
            <div className="lg:flex-shrink-0 lg:w-1/2">
              <img
                className="w-full object-cover rounded-lg shadow-lg"
                src="./logo.png"
                alt="Debate illustration"
              />
            </div>
          </div>
        </div>
      </div>
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

      <div className="mt-8 text-center">
        {user ? (
          <>

            <Button onClick={() => navigateTo('forums')} size="lg">
              Explore Forums
            </Button>
            <div className="mt-4">
              <p className="text-center pt-">Made by Aditya Senthilnathan</p>
            </div>
          </>
        ) : (
          <>
            <Button onClick={() => navigateTo('forums')} size="lg">
              Explore Forums
            </Button>
          </>
        )}
      </div>
    </div>
  )

  // Forums page UI
  const ForumsPage = () => {
    const [forumPostCounts, setForumPostCounts] = useState<{ [key: string]: number }>({});

    useEffect(() => {
      const fetchForumPostCounts = async () => {
        const forums = ['Lincoln-Douglas', 'Parliamentary', 'Policy', 'Public Forum'];
        const counts = await Promise.all(
          forums.map(async (forum) => {
            const postsRef = collection(db, 'forums', forum, 'posts');
            const snapshot = await getDocs(postsRef);
            return { [forum]: snapshot.size };
          })
        );
        setForumPostCounts(Object.assign({}, ...counts));
      };

      fetchForumPostCounts();
    }, []);

    return (
      <div className="container mx-auto px-4 py-8">
        <h2 className="text-3xl font-bold mb-6">Debate Forums</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {['Lincoln-Douglas', 'Parliamentary', 'Policy', 'Public Forum'].map((format) => (
            <Card key={format}>
              <CardHeader>
                <CardTitle>{format}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <MessageCircle className="h-5 w-5" />
                    <span>{forumPostCounts[format] || 0} posts</span>
                  </div>
                  <Button variant="outline" onClick={() => handleForumNavigation(format)}>
                    View Forum
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  };

  // Forum page UI (displays posts and new post form)
  const countHiddenComments = (comments: Comment[], visibleCount: number): number => {
    if (comments.length <= visibleCount) {
      return 0;
    }
    const hiddenComments = comments.slice(visibleCount);
    return hiddenComments.reduce((count, comment) => {
      return count + 1 + countReplies(comment.replies);
    }, 0);
  };

  // Utility function to format date with short forms
  const formatDate = (seconds: number): string => {
    const now = Date.now() / 1000;
    const diff = now - seconds;

    if (diff < 60) return `${Math.floor(diff)} sec ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`;
    if (diff < 31536000) return `${Math.floor(diff / 86400)} days ago`;
    return `${Math.floor(diff / 31536000)} yrs ago`;
  };

  const countTotalComments = (comments: Comment[]): number => {
    return comments.reduce((count, comment) => {
      return count + 1 + countTotalComments(comment.replies);
    }, 0);
  };

  // Filter and sort posts
  const filteredPosts = posts
    .filter((post) => post.title.toLowerCase().includes(searchQuery.toLowerCase()) || post.content.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      if (sortOption === 'newest') {
        return b.createdAt.seconds - a.createdAt.seconds;
      } else if (sortOption === 'oldest') {
        return a.createdAt.seconds - b.createdAt.seconds;
      } else if (sortOption === 'mostLiked') {
        return b.likes.length - a.likes.length;
      }
      return 0;
    });

  const ForumPage = () => {
    const [userNames, setUserNames] = useState<{ [key: string]: string }>({});
    const [showNewDiscussion, setShowNewDiscussion] = useState<boolean>(false);

    useEffect(() => {
      const fetchUserNames = async () => {
        const names = await Promise.all(
          filteredPosts.map(async (post) => {
            const userName = await getUserName(post.userEmail);
            return { [post.id]: userName };
          })
        );
        setUserNames(Object.assign({}, ...names));
      };

      fetchUserNames();
    }, [filteredPosts]);

    if (!currentForum) {
      return <div>Please select a forum to enter.</div>;
    }

    return (
      <div className="bg-gray-100">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{currentForum} Debate Forum</h1>
          </div>
          <Button onClick={() => setShowNewDiscussion(!showNewDiscussion)}>
            {showNewDiscussion ? 'Hide New Post' : 'Create New Post'}
          </Button>
        </div>
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          {showNewDiscussion && (
            <div className="mb-8">
              <h3 className="text-xl font-semibold mb-4">Start a New Discussion</h3>
              <Input ref={titleRef} placeholder="Title of your question" />
              <Textarea ref={contentRef} placeholder="Provide details about your question..." />
              {currentPage === 'forum' && error && <p className="text-red-500 mt-2">{error}</p>}
              <Button onClick={handlePostSubmit} className="mt-4" disabled={loading}>
                {loading ? 'Submitting...' : 'Submit Post'}
              </Button>
            </div>
          )}
        </div>
        <main className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold text-gray-900">Recent Discussions</h2>
              <div className="flex items-center space-x-4">
              <select
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value)}
                  className="ml-2 p-1.5 border rounded"
                >
                  <option value="newest">Newest</option>
                  <option value="oldest">Oldest</option>
                  <option value="mostLiked">Most Liked</option>
                </select>
                <Input ref={searchInputRef} defaultValue={searchQuery} placeholder="Search this forum" className="w-[300px]" />
                <Button onClick={handleSearch} className="ml-2">Search</Button>
              </div>
            </div>
            <div className="space-y-6">
              {filteredPosts.length === 0 ? (
                <p>No posts available yet. Be the first to start a discussion!</p>
              ) : (
                filteredPosts.map((post) => {
                  const userName = userNames[post.id];
                  return (
                    <Card key={post.id}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <p>
                              <span className="text-sm text-gray-500">Posted by </span>
                              <span className="relative group font-medium text-gray-700">
                                {userName}
                                <span className="absolute left-0 bottom-full mb-1 w-max p-1 text-xs text-white bg-black rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-500">
                                  {post.userEmail}
                                </span>
                              </span>
                              <span className="text-sm text-gray-500"> •{formatDate(post.createdAt.seconds)}• </span>
                            </p>
                          </div>
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center">
                              <ThumbsUp className="h-5 w-5 text-gray-400 mr-1" />
                              <span className="text-sm text-gray-500">{post.likes.length}</span>
                            </div>
                            <div className="flex items-center">
                              <MessageCircle className="h-5 w-5 text-gray-400 mr-1" />
                              <span className="text-sm text-gray-500">{countTotalComments(post.comments)} replies</span>
                            </div>
                          </div>
                        </div>
                        <CardTitle className="pt-2">{post.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-700">{post.content}</p>
                      </CardContent>
                      <CardFooter className="p-4 pt-0">
                        <Button onClick={() => handleLikePost(post.id)}>
                          {post.likes?.includes(user?.uid || '') ? 'Unlike' : 'Like'}
                        </Button>
                        <div className="pl-4">
                          <Button onClick={() => navigateTo('post', post)}>
                            Comments
                          </Button>
                        </div>
                      </CardFooter>
                    </Card>
                  );
                })
              )}
            </div>
          </div>
        </main>
      </div>
    );
  };

  const PostPage = () => {
    const [showAllComments, setShowAllComments] = useState<{ [key: string]: boolean }>({});
    const [showReplies, setShowReplies] = useState<{ [key: string]: boolean }>({});
    const userName = useUserName(selectedPost?.userEmail || '');

    if (!selectedPost) {
      return <div>No post selected.</div>;
    }

    return (
      <div className="container mx-auto px-4 py-8">
        <p className='pb-5'>
          <span className="text-sm text-gray-500">Posted by </span>
          <span className="relative group font-medium text-gray-700">
            {userName}
            <span className="absolute left-0 bottom-full mb-1 w-max p-1 text-xs text-white bg-black rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-500">
              {selectedPost.userEmail}
            </span>
          </span>
          <span className="text-sm text-gray-500"> •{formatDate(selectedPost.createdAt.seconds)}• </span>
        </p>
        <h2 className="text-3xl font-bold mb-6 pl-5">{selectedPost.title}</h2>
        <div className="mt-4 pl-5 bg-white rounded-lg p-4 shadow-md">
          {selectedPost.content}
        </div>
        <CardFooter className="pt-4">
          <Button onClick={() => navigateTo('forum')}>
            Back to Forum
          </Button>
          <div className="pl-4">
            <Button onClick={() => handleLikePost(selectedPost.id)}>
              {selectedPost.likes?.includes(user?.uid || '') ? 'Unlike' : 'Like'} ({selectedPost.likes?.length || 0})
            </Button>
          </div>
        </CardFooter>
        <div className="mt-4 ml-8">
          <h4 className="text-lg font-semibold pb-4">Comments</h4>
          {selectedPost.comments.length === 0 ? (
            <p>There are no comments, add to the discussion!</p>
          ) : (
            selectedPost.comments.slice(0, showAllComments[selectedPost.id] ? selectedPost.comments.length : 3).map((comment) => (
              <CommentComponent key={comment.id} comment={comment} postId={selectedPost.id} showReplies={showReplies} setShowReplies={setShowReplies} />
            ))
          )}
          {selectedPost.comments.length > 3 && (
            <Button variant="link" onClick={() => setShowAllComments((prev) => ({ ...prev, [selectedPost.id]: !prev[selectedPost.id] }))}>
              {showAllComments[selectedPost.id] ? 'Show less comments' : `See more comments (${countHiddenComments(selectedPost.comments, 3)})`}
            </Button>
          )}
          <Textarea ref={(el) => { commentRefs.current[selectedPost.id] = el }} placeholder="Add a comment..." className="mt-2 ml-4 w-11/12" />
          <Button onClick={() => handleCommentSubmit(selectedPost.id)} className="mt-2 ml-4">
            Submit Comment
          </Button>
          {currentPage === 'post' && error && <p className="text-red-500 mt-2">{error}</p>}
        </div>
      </div>
    );
  };

  // Comment component to handle nested comments

  const countReplies = (replies: Comment[]): number => {
    return replies.reduce((count, reply) => {
      return count + 1 + countReplies(reply.replies);
    }, 0);
  }; const CommentComponent = ({ comment, postId, showReplies, setShowReplies }: { comment: Comment, postId: string, showReplies: { [key: string]: boolean }, setShowReplies: React.Dispatch<React.SetStateAction<{ [key: string]: boolean }>> }) => {
    const [showAllReplies, setShowAllReplies] = useState<{ [key: string]: boolean }>({});
    const [showReplyBox, setShowReplyBox] = useState<{ [key: string]: boolean }>({});
    const userName = useUserName(comment.userEmail);

    const visibleRepliesCount = 2; // Number of replies to show initially

    const toggleShowReplies = (commentId: string) => {
      setShowReplies((prev) => ({ ...prev, [commentId]: !prev[commentId] }));
    };

    const toggleShowAllReplies = (commentId: string) => {
      setShowAllReplies((prev) => ({ ...prev, [commentId]: !prev[commentId] }));
    };

    const toggleShowReplyBox = (commentId: string) => {
      setShowReplyBox((prev) => ({ ...prev, [commentId]: !prev[commentId] }));
    };

    return (
      <div className="comment-container">
        <div className="comment-content">
          <p>
            <span className="relative group font-medium text-gray-700">
              {userName}
              <span className="absolute left-0 bottom-full mb-1 w-max p-1 text-xs text-white bg-black rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-500">
                {comment.userEmail}
              </span>
            </span>
            <span className="text-sm text-gray-500"> •{formatDate(comment.createdAt.seconds)}•</span>
          </p>
          <p className="mt-2 ml-4 pr-4">{comment.content}</p>
          {comment.replies.length > 0 && (
            <Button variant="link" onClick={() => toggleShowReplies(comment.id)}>
              {showReplies[comment.id] ? 'Hide replies' : `Show replies (${countReplies(comment.replies)})`}
            </Button>
          )}
          <Button variant="link" onClick={() => toggleShowReplyBox(comment.id)}>
            {showReplyBox[comment.id] ? 'Cancel' : 'Reply'}
          </Button>
        </div>
        {showReplies[comment.id] && (
          <div>
            {comment.replies.slice(0, showAllReplies[comment.id] ? comment.replies.length : visibleRepliesCount).map((reply) => (
              <CommentComponent key={reply.id} comment={reply} postId={postId} showReplies={showReplies} setShowReplies={setShowReplies} />
            ))}
            {comment.replies.length > visibleRepliesCount && (
              <Button variant="link" onClick={() => toggleShowAllReplies(comment.id)}>
                {showAllReplies[comment.id] ? 'Show less replies' : `See more replies (${countReplies(comment.replies.slice(visibleRepliesCount))})`}
              </Button>
            )}
          </div>
        )}
        {showReplyBox[comment.id] && (
          <div className="reply-box">
            <Textarea
              ref={(el) => { replyRefs.current[comment.id] = el }}
              placeholder="Add a reply..."
              className="mt-2 ml-4 w-11/12"
            />
            <Button onClick={() => handleCommentSubmit(postId, comment.id)} className="mt-2">
              Submit Reply
            </Button>
          </div>
        )}
      </div>
    );
  };

  const AccountPage = () => {
    const [newDisplayName, setNewDisplayName] = useState<string>('');
    const [updateLoading, setUpdateLoading] = useState<boolean>(false);
    const [updateError, setUpdateError] = useState<string>('');

    const handleDisplayNameChange = async () => {
      if (!newDisplayName) {
        setUpdateError('Display name cannot be empty.');
        return;
      }

      setUpdateLoading(true);
      try {
        const currentUser = auth.currentUser;
        if (currentUser) {
          const userDocRef = doc(db, 'users', currentUser.uid);
          await setDoc(userDocRef, { displayName: newDisplayName }, { merge: true });
          setUser({ ...currentUser, displayName: newDisplayName });
          setUpdateError('');
        }
      } catch (error) {
        console.error('Error updating display name:', error);
        setUpdateError('Failed to update display name. Please try again later.');
      }
      setUpdateLoading(false);
    };

    if (!user) {
      return <div>Please log in to view your account details.</div>;
    }

    return (
      <div className="container mx-auto px-4 py-8">
        <h2 className="text-3xl font-bold mb-6">Account Details</h2>
        <div className="bg-white rounded-lg p-4 shadow-md">
          <p><strong>Name:</strong> {user.displayName || 'Anonymous'}</p>
          <p><strong>Email:</strong> {user.email}</p>
          <div className="mt-4">
            <Input
              value={newDisplayName}
              onChange={(e) => setNewDisplayName(e.target.value)}
              placeholder="New display name"
            />
            {updateError && <p className="text-red-500 mt-2">{updateError}</p>}
            <Button onClick={handleDisplayNameChange} className="mt-2" disabled={updateLoading}>
              {updateLoading ? 'Updating...' : 'Update Display Name'}
            </Button>
          </div>
        </div>

      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <nav className="mx-auto py-4">
          <ul className="flex items-center justify-between w-full px-10">
            <img src="./favicon.png" alt="Logo" className="w-14 h-14 rounded-md" />
            <div className="flex-1 flex  items-center space-x-4 pl-20">
              <Button variant="ghost" onClick={() => navigateTo('home')}>Home</Button>
              <Button variant="ghost" onClick={() => navigateTo('forums')}>Forums</Button>
              <Button variant="ghost" onClick={() => navigateTo('account')}>Account</Button>
            </div>


            <span className="relative group pr-5">
              <span>{user?.email}</span>

            </span>
            <Button onClick={handleSignOut} size="lg">
              Log Out
            </Button>
          </ul>
        </nav>
      </header>
      <main>
        {currentPage === 'home' && <HomePage />}
        {currentPage === 'forums' && <ForumsPage />}
        {currentPage === 'forum' && <ForumPage />}
        {currentPage === 'post' && <PostPage />}
        {currentPage === 'account' && <AccountPage />}
      </main>
    </div>
  );
}