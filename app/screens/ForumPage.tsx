"use client"

import '../globals.css'
import { useState, useEffect, useRef } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { collection, addDoc, query, onSnapshot, updateDoc, doc, arrayUnion, arrayRemove } from 'firebase/firestore'
import { db, auth } from '../firebaseConfig'
import { signOut, onAuthStateChanged, User } from 'firebase/auth'
import './ForumPage.css'; // Import the CSS file for curved lines

interface Post {
  id: string;
  title: string;
  content: string;
  createdAt: { seconds: number }; // Firestore timestamp format
  userName: string;
  likes: string[]; // Array of user IDs who liked the post
  comments: Comment[]; // Array of comments
}

interface Comment {
  id: string;
  content: string;
  createdAt: { seconds: number }; // Firestore timestamp format
  userName: string;
  replies: Comment[]; // Array of nested comments
}

export default function DebateForum() {
  const [currentPage, setCurrentPage] = useState<string>('home')
  const [currentForum, setCurrentForum] = useState<string>('') // Forum selected
  const [posts, setPosts] = useState<Post[]>([]) // Typed posts state
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string>('')
  const [user, setUser] = useState<User | null>(null) // User authentication state

  const titleRef = useRef<HTMLInputElement>(null)
  const contentRef = useRef<HTMLTextAreaElement>(null)
  const commentRefs = useRef<{ [key: string]: HTMLTextAreaElement | null }>({})
  const replyRefs = useRef<{ [key: string]: HTMLTextAreaElement | null }>({})

  // Fetch the user authentication status on mount
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user) // Set the user or null if logged out
    })
    return unsubscribe // Cleanup on component unmount
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
    if (!titleRef.current?.value || !contentRef.current?.value) {
      setError('Both title and content are required.')
      return
    }

    setLoading(true)
    try {
      const postsRef = collection(db, 'forums', currentForum, 'posts')
      await addDoc(postsRef, {
        title: titleRef.current.value,
        content: contentRef.current.value,
        createdAt: new Date(),
        userName: user?.displayName || user?.email || 'Anonymous',
        likes: [], // Initialize likes as an empty array
        comments: [], // Initialize comments as an empty array
      })
      titleRef.current.value = '' // Reset title after successful submission
      contentRef.current.value = '' // Reset content after successful submission
      setError('') // Clear error
    } catch (error) {
      console.error('Error adding post:', error)
      setError('Failed to add the post. Please try again later.')
    }
    setLoading(false)
  }

  // Handle post like
  const handleLikePost = async (postId: string) => {
    if (!user) {
      setError('You must be logged in to like a post.')
      return
    }

    const postRef = doc(db, 'forums', currentForum, 'posts', postId)
    const post = posts.find((post) => post.id === postId)

    if (post) {
      const isLiked = post.likes.includes(user.uid)
      try {
        await updateDoc(postRef, {
          likes: isLiked ? arrayRemove(user.uid) : arrayUnion(user.uid),
        })
      } catch (error) {
        console.error('Error updating likes:', error)
        setError('Failed to update likes. Please try again later.')
      }
    }
  }

  // Handle comment submission
  const handleCommentSubmit = async (postId: string, parentCommentId?: string) => {
    if (!user) {
      setError('You must be logged in to comment.')
      return
    }
  
    const commentContent = parentCommentId ? replyRefs.current[parentCommentId]?.value : commentRefs.current[postId]?.value
    if (!commentContent) {
      setError('Comment content is required.')
      return
    }
  
    const postRef = doc(db, 'forums', currentForum, 'posts', postId)
    const newComment = {
      id: `${postId}-${Date.now()}`, // Generate a unique ID for the comment
      content: commentContent,
      createdAt: { seconds: Math.floor(Date.now() / 1000) },
      userName: user.displayName || user.email || 'Anonymous',
      replies: [], // Initialize replies as an empty array
    }
  
    try {
      if (parentCommentId) {
        // Add reply to a specific comment
        const post = posts.find((post) => post.id === postId)
        if (post) {
          const parentComment = findComment(post.comments, parentCommentId)
          if (parentComment) {
            parentComment.replies.push(newComment)
            await updateDoc(postRef, {
              comments: post.comments,
            })
            console.log('Reply added:', newComment)
          }
        }
      } else {
        // Add comment to the post
        await updateDoc(postRef, {
          comments: arrayUnion(newComment),
        })
        console.log('Comment added:', newComment)
      }
      if (parentCommentId) {
        replyRefs.current[parentCommentId]!.value = '' // Reset reply after successful submission
      } else {
        commentRefs.current[postId]!.value = '' // Reset comment after successful submission
      }
      setError('') // Clear error
    } catch (error) {
      console.error('Error adding comment:', error)
      setError('Failed to add the comment. Please try again later.')
    }
  }

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

  // Handle navigation between pages
  const navigateTo = (page: string) => {
    setCurrentPage(page)
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
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-6 text-center">Debate Skills Improvement Forum</h1>
      <p className="text-xl text-center mb-8">
        Welcome to the premier online platform for high school debaters to refine their skills across various debate formats.
      </p>
      <div className="mt-8 text-center">
        {user ? (
          <>
            <Button onClick={() => navigateTo('forums')} size="lg">
              Explore Forums
            </Button>
            <div className="mt-4">
              <p>Welcome, {user.displayName || user.email}!</p>
              <Button onClick={handleSignOut} size="lg">
                Log Out
              </Button>
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

  // Forums page UI (lists forums)
  const ForumsPage = () => (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-3xl font-bold mb-6">Debate Forums</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {['Lincoln-Douglas', 'Parliamentary', 'Policy', 'Public Forum'].map((format) => (
          <Card key={format}>
            <CardHeader>
              <CardTitle>{format}</CardTitle>
            </CardHeader>
            <CardFooter>
              <Button onClick={() => handleForumNavigation(format)}>
                Enter Forum
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )

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

  const ForumPage = () => {
    const [showAllComments, setShowAllComments] = useState<{ [key: string]: boolean }>({});
  
    if (!currentForum) {
      return <div>Please select a forum to enter.</div>;
    }
  
    return (
      <div className="container mx-auto px-4 py-8">
        <h2 className="text-3xl font-bold mb-6">{currentForum} Forum</h2>
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4">Start a New Discussion</h3>
          <Input ref={titleRef} placeholder="Title of your question" />
          <Textarea ref={contentRef} placeholder="Provide details about your question..." />
          {error && <p className="text-red-500 mt-2">{error}</p>}
          <Button onClick={handlePostSubmit} className="mt-4" disabled={loading}>
            {loading ? 'Submitting...' : 'Submit Post'}
          </Button>
        </div>
        <h3 className="text-xl font-semibold mb-4">Recent Discussions</h3>
        {posts.length === 0 ? (
          <p>No posts available yet. Be the first to start a discussion!</p>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <Card key={post.id}>
                <CardHeader>
                  <div className="flex items-center">
                    <div>
                      <CardTitle className = "pb-4">{post.title}</CardTitle>
                      <p>
                      <span className="text-sm text-gray-500">Posted by </span>
                        <span className="font-medium text-gray-700">{post.userName}</span> 
                        <span className="text-sm text-gray-500"> •{formatDate(post.createdAt.seconds)}• </span>
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>{post.content}</CardContent>
                <CardFooter>
                  <Button onClick={() => handleLikePost(post.id)}>
                    {post.likes?.includes(user?.uid || '') ? 'Unlike' : 'Like'} ({post.likes?.length || 0})
                  </Button>
                </CardFooter>
                <div className="mt-4 ml-8">
                  <h4 className="text-lg font-semibold pb-4 ">Comments</h4>
                  {post.comments.slice(0, showAllComments[post.id] ? post.comments.length : 3).map((comment) => (
                    <CommentComponent key={comment.id} comment={comment} postId={post.id} />
                  ))}
                  {post.comments.length > 3 && (
                    <Button variant="link" onClick={() => setShowAllComments((prev) => ({ ...prev, [post.id]: !prev[post.id] }))}>
                      {showAllComments[post.id] ? 'Show less comments' : `See more comments (${countHiddenComments(post.comments, 3)})`}
                    </Button>
                  )}
                  
                  <Textarea ref={(el) => { commentRefs.current[post.id] = el }} placeholder="Add a comment..." className="mt-2 ml-4 w-11/12" />
                  <Button onClick={() => handleCommentSubmit(post.id)} className="mt-2 ml-4">
                    Submit Comment
                  </Button>
                 
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Comment component to handle nested comments
  
const countReplies = (replies: Comment[]): number => {
  return replies.reduce((count, reply) => {
    return count + 1 + countReplies(reply.replies);
  }, 0);
};
const CommentComponent = ({ comment, postId }: { comment: Comment, postId: string }) => {
  const [showReplies, setShowReplies] = useState(false);
  const [showAllReplies, setShowAllReplies] = useState(false);
  const [showReplyBox, setShowReplyBox] = useState(false);
  //const replyRef = useRef<HTMLTextAreaElement | null>(null);

  const visibleRepliesCount = 2; // Number of replies to show initially

  return (
    <div className="comment-container">
      <div className="comment-content">
        <p>
          <span className="font-medium text-gray-700">{comment.userName}</span> 
          <span className="text-sm text-gray-500"> •{formatDate(comment.createdAt.seconds)}•</span>
        </p>
        <p className = "mt-2 ml-4 pr-4">{comment.content}</p>
        {comment.replies.length > 0 && (
          <Button variant="link" onClick={() => setShowReplies(!showReplies)}>
            {showReplies ? 'Hide replies' : `Show replies (${countReplies(comment.replies)})`}
          </Button>
        )}
        <Button variant="link" onClick={() => setShowReplyBox(!showReplyBox)}>
          {showReplyBox ? 'Cancel' : 'Reply'}
        </Button>
      </div>
      {showReplies && (
        <div>
          {comment.replies.slice(0, showAllReplies ? comment.replies.length : visibleRepliesCount).map((reply) => (
            <CommentComponent key={reply.id} comment={reply} postId={postId} />
          ))}
          {comment.replies.length > visibleRepliesCount && (
            <Button variant="link" onClick={() => setShowAllReplies(!showAllReplies)}>
              {showAllReplies ? 'Show less replies' : `See more replies (${countReplies(comment.replies.slice(visibleRepliesCount))})`}
            </Button>
          )}
        </div>
      )}
      {showReplyBox && (
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
  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <nav className="container mx-auto px-4 py-4">
          <ul className="flex space-x-4">
            <li><Button variant="ghost" onClick={() => navigateTo('home')}>Home</Button></li>
            <li><Button variant="ghost" onClick={() => navigateTo('forums')}>Forums</Button></li>
          </ul>
        </nav>
      </header>
      <main>
        {currentPage === 'home' && <HomePage />}
        {currentPage === 'forums' && <ForumsPage />}
        {currentPage === 'forum' && <ForumPage />}
      </main>
    </div>
  )
}