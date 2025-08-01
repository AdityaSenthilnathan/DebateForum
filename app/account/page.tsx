"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '../authContext';
import { db } from '../firebaseConfig';
import { doc, setDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NavigationBar } from '../screens/ForumPage';

export default function AccountPage() {
  const { currentUser, signOut } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [newDisplayName, setNewDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (currentUser) {
      setDisplayName(currentUser.displayName || '');
    }
  }, [currentUser]);

  const handleUpdate = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const userDocRef = doc(db, 'users', currentUser.uid);
      await setDoc(userDocRef, { displayName: newDisplayName }, { merge: true });
      setDisplayName(newDisplayName);
      setNewDisplayName('');
      setError('');
    } catch (e) {
      setError('Failed to update display name.');
    }
    setLoading(false);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      setError('Failed to sign out.');
    }
  };

  if (!currentUser) return <div>Please sign in to view your account.</div>;

  return (
    <div className="min-h-screen bg-gray-100">
      <NavigationBar user={currentUser} handleSignOut={handleSignOut} />
      <div className="container mx-auto px-4 py-8">
        <h2 className="text-3xl font-bold mb-6">Account Details</h2>
        <div className="bg-white rounded-lg p-4 shadow-md">
          <p><strong>Name:</strong> {displayName || 'Anonymous'}</p>
          <p><strong>Email:</strong> {currentUser.email}</p>
          <div className="mt-4">
            <Input
              value={newDisplayName}
              onChange={e => setNewDisplayName(e.target.value)}
              placeholder="New display name"
            />
            {error && <p className="text-red-500 mt-2">{error}</p>}
            <Button onClick={handleUpdate} className="mt-2" disabled={loading}>
              {loading ? 'Updating...' : 'Update Display Name'}
            </Button>
            <Button onClick={handleSignOut} className="mt-2 ml-4" variant="outline">
              Log Out
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
