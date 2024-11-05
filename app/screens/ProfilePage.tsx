// components/ProfilePage.tsx
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../firebaseConfig'; // Adjust the path according to your project structure
import { doc, onSnapshot } from 'firebase/firestore';

const ProfilePage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const [userStats, setUserStats] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'users', userId), (doc) => {
      setUserStats(doc.data());
    });

    return () => unsubscribe();
  }, [userId]);

  if (!userStats) return <div>Loading...</div>;

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
