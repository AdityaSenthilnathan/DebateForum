'use client';
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../firebaseConfig';
import { getStorage } from 'firebase/storage';

const storage = getStorage();
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';

interface UserStats {
  name: string;
  posts: number;
  comments: number;
  answered: number;
  profilePicture: string;
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

  const handleProfilePictureChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const storageRef = ref(storage, `profilePictures/${userId}`);
      await uploadBytes(storageRef, file);
      const profilePictureURL = await getDownloadURL(storageRef);
      await updateDoc(doc(db, 'users', userId), { profilePicture: profilePictureURL });
      setUserStats((prevStats) => prevStats ? { ...prevStats, profilePicture: profilePictureURL } : null);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;
  if (!userStats) return <div>No user data available</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-3xl font-bold mb-6">{userStats.name}&apos;s Profile</h2>
      <img src={userStats.profilePicture || `https://via.placeholder.com/150?text=${userStats.name.charAt(0)}`} alt="Profile" className="w-32 h-32 rounded-full mb-4" />
      <input type="file" onChange={handleProfilePictureChange} />
      <p>Posts: {userStats.posts}</p>
      <p>Comments: {userStats.comments}</p>
      <p>Questions Answered: {userStats.answered}</p>
    </div>
  );
};

export default ProfilePage;