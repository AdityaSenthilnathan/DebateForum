"use client"

import '../globals.css'
import { useState, useEffect, useRef } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { collection, addDoc, query, onSnapshot } from 'firebase/firestore'
import { db, auth } from '../firebaseConfig'
import { signOut, onAuthStateChanged, User } from 'firebase/auth'

interface Post {
  id: string;
  title: string;
  content: string;
  createdAt: { seconds: number }; // Firestore timestamp format
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
  const ForumPage = () => {
    if (!currentForum) {
      return <div>Please select a forum to enter.</div>
    }

    return (
      <div className="container mx-auto px-4 py-8">
        <h2 className="text-3xl font-bold mb-6">{currentForum} Forum</h2>
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4">Start a New Discussion</h3>
          <Input
            ref={titleRef}
            placeholder="Title of your question"
          />
          <Textarea
            ref={contentRef}
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