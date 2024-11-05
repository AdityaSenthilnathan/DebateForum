// components/ForumPage.tsx
import React, { useEffect, useState } from 'react';
import { db } from '../firebaseConfig'; // Adjust the path according to your project structure
import { collection, addDoc, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../authContext';

const ForumPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [posts, setPosts] = useState<any[]>([]);
  const [newPost, setNewPost] = useState('');
  const [newPostTitle, setNewPostTitle] = useState('');
  const [forumType] = useState('Parliamentary'); // Default forum type

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, forumType), (snapshot) => {
      const postsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPosts(postsData);
    });

    return () => unsubscribe();
  }, [forumType]);

  const handlePostSubmit = async () => {
    if (newPost.trim() === '' || newPostTitle.trim() === '') return;

    try {
      await addDoc(collection(db, forumType), {
        title: newPostTitle,
        content: newPost,
        createdAt: new Date(),
        userId: currentUser.uid, // Include user ID for tracking
        authorName: currentUser.displayName || currentUser.email, // Show name
      });
      setNewPost('');
      setNewPostTitle('');
    } catch (error) {
      console.error("Error adding document: ", error);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-3xl font-bold mb-6">{forumType} Forum</h2>
      <div>
        <h3>Post a New Discussion</h3>
        <input
          type="text"
          placeholder="Enter post title"
          value={newPostTitle}
          onChange={(e) => setNewPostTitle(e.target.value)}
          className="mb-2 border p-2 rounded"
        />
        <textarea
          placeholder="Type your post content here..."
          value={newPost}
          onChange={(e) => setNewPost(e.target.value)}
          rows={3}
          className="resize-none mb-2 border p-2 rounded"
        />
        <button onClick={handlePostSubmit} className="bg-green-500 text-white py-2 px-4 rounded">Post</button>
      </div>
      <ul>
        {posts.map((post) => (
          <li key={post.id} className="mb-4 p-4 border rounded">
            <h3 className="font-semibold">{post.title}</h3>
            <p>{post.content}</p>
            <p className="text-sm text-gray-500">
              Posted by <a href={`/profile/${post.userId}`} className="text-blue-500">{post.authorName}</a> at {new Date(post.createdAt.seconds * 1000).toLocaleString()}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ForumPage;
