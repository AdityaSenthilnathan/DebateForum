'use client';

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FaGoogle } from 'react-icons/fa'
import { signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth'
import { auth, googleProvider } from '../firebaseConfig'

export default function SignIn() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('') // State for error messages

  // Handle sign in with email and password
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('') // Reset error message on submit

    try {
      await signInWithEmailAndPassword(auth, email, password)
      console.log('Successfully signed in with email/password')
      // Redirect user to the appropriate page after successful login
    } catch (error) {
      setError('Failed to sign in with email/password. Please check your credentials.') // Handle error
      console.error('Error signing in with email/password:', error)
    }
  }

  // Handle Google sign in
  const handleGoogleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider)
      console.log('Successfully signed in with Google')
      // Redirect user to the appropriate page after successful login
    } catch (error) {
      setError('Failed to sign in with Google. Please try again later.')
      console.error('Error signing in with Google:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <Card className="w-[350px]">
        <CardHeader>
          <CardTitle>Welcome to DebateHub</CardTitle>
          <CardDescription>Sign in to your account</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="email" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="email">Email</TabsTrigger>
              <TabsTrigger value="google">Google</TabsTrigger>
            </TabsList>
            <TabsContent value="email">
              <form onSubmit={handleSignIn} className="space-y-4">
                {error && <p className="text-red-500">{error}</p>} {/* Display error if exists */}
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="m@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full">Sign In</Button>
              </form>
            </TabsContent>
            <TabsContent value="google">
              <Button onClick={handleGoogleSignIn} className="w-full" variant="outline">
                <FaGoogle className="mr-2" />
                Sign in with Google
              </Button>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-gray-500">
            Don't have an account?{" "}
            <a href="#" className="text-blue-500 hover:underline">
              Sign up
            </a>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
