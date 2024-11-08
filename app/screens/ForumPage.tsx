'use client'

import '../globals.css'
import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { collection, addDoc, query, onSnapshot } from 'firebase/firestore'
import { db, auth } from '../firebaseConfig'
import { signInWithEmailAndPassword, signOut, onAuthStateChanged, User } from 'firebase/auth'

export default function DebateForum() {
  const [currentPage, setCurrentPage] = useState('home')
  const [currentForum, setCurrentForum] = useState('') // Ensure this is set before rendering ForumPage
  const [posts, setPosts] = useState<any[]>([]) // Use a proper type for posts, change 'any' to the correct post type later
  const [newPost, setNewPost] = useState({ title: '', content: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [user, setUser] = useState<User | null>(null) // State to hold the logged-in user, typed as User | null

  // Handle authentication state change
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user) // Set user if logged in, null if not
    })
    return unsubscribe
  }, [])

  // Sign In Function (typed parameters)
  const handleSignIn = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password)
    } catch (error) {
      console.error('Error signing in:', error)
      setError('Failed to sign in. Please check your credentials.')
    }
  }

  // Sign Out Function
  const handleSignOut = async () => {
    try {
      await signOut(auth)
    } catch (error) {
      console.error('Error signing out:', error)
      setError('Failed to sign out. Please try again later.')
    }
  }

  // Fetch posts from Firestore
  useEffect(() => {
    if (currentForum) {
      const postsRef = collection(db, 'forums', currentForum, 'posts')
      const q = query(postsRef)

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const fetchedPosts = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        setPosts(fetchedPosts)
        console.log("Fetched posts:", fetchedPosts);  // Debugging: Log posts data
      }, (error) => {
        console.error('Error fetching posts:', error)
        setError('Failed to fetch posts.')
      })

      return unsubscribe
    }
  }, [currentForum])

  // Handle creating a new post
  const handlePostSubmit = async () => {
    if (!newPost.title || !newPost.content) {
      setError('Both title and content are required.')
      return
    }

    setLoading(true)
    try {
      const postsRef = collection(db, 'forums', currentForum, 'posts')
      await addDoc(postsRef, {
        title: newPost.title,
        content: newPost.content,
        createdAt: new Date()
      })
      setNewPost({ title: '', content: '' }) // Reset form
      setError('') // Clear any error messages
    } catch (error) {
      console.error('Error adding post:', error)
      setError('Failed to add the post. Please try again later.')
    }
    setLoading(false)
  }

  // Navigation function to switch pages
  const navigateTo = (page: string) => {
    console.log("Attempting to navigate to:", page);
    if (['home', 'forums', 'forum'].includes(page)) {
      setCurrentPage(page);
      console.log("Navigated to:", page);
    } else {
      console.error(`Invalid page: ${page}`);
    }
  }

  // Navigation function to switch forums
  const handleForumNavigation = (forum: string) => {
    console.log("Navigating to forum:", forum);
    if (forum) {
      setCurrentForum(forum); // Make sure this is set before navigating
      navigateTo('forum');
    } else {
      console.error('No valid forum selected.');
    }
  }

  // Home Page Component
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
            <Button onClick={() => handleSignIn('testuser@example.com', 'password123')} className="mt-4">
              Sign In (Test User)
            </Button>
          </>
        )}
      </div>
    </div>
  )

  // Forums Page Component
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

  // Forum Page Component to display posts and add new post
  const ForumPage = () => {
    if (!currentForum) {
      return <div>Please select a forum to enter.</div>;  // Show message if no forum is selected
    }

    return (
      <div className="container mx-auto px-4 py-8">
        <h2 className="text-3xl font-bold mb-6">{currentForum} Forum</h2>
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4">Start a New Discussion</h3>
          <Input
            value={newPost.title}
            onChange={(e) => {
              setNewPost((prevPost) => ({
                ...prevPost, // Preserve the other properties in the state
                title: e.target.value // Update only the title
              }));
            }}
            placeholder="Title of your question"
          />
          <Textarea
            value={newPost.content}
            onChange={(e) => {
              setNewPost((prevPost) => ({
                ...prevPost, // Preserve the other properties in the state
                content: e.target.value // Update only the content
              }));
            }}
            placeholder="Provide details about your question..."
          />
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
                  <CardTitle>{post.title}</CardTitle>
                </CardHeader>
                <CardContent>{post.content}</CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    )
  }

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