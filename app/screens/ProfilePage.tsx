'use client';
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../firebaseConfig';
import { doc, onSnapshot } from 'firebase/firestore';

interface UserStats {
  name: string;
  posts: number;
  comments: number;
  answered: number;
}

const ProfilePage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'users', userId), (doc) => {
      if (doc.exists()) {
        setUserStats(doc.data() as UserStats);
        setLoading(false);
      } else {
        setError("User not found");
        setLoading(false);
      }
    }, (error) => {
      console.error("Error fetching user data: ", error);
      setError("Error fetching user data");
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;
  if (!userStats) return <div>No user data available</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-3xl font-bold mb-6">{userStats.name}'s Profile</h2>
      <p>Posts: {userStats.posts}</p>
      <p>Comments: {userStats.comments}</p>
      <p>Questions Answered: {userStats.answered}</p>
    </div>
  );
};

export default ProfilePage;
