import { db } from '@/app/firebaseConfig';
import { collection, getDocs, Timestamp } from 'firebase/firestore';
import ForumClient, { Post } from './ForumClient';

// Helper function to convert Firestore timestamps to plain objects
const convertTimestamps = (data: any): any => {
  if (data === null || data === undefined) return data;
  if (data instanceof Timestamp) {
    return { seconds: data.seconds, nanoseconds: data.nanoseconds };
  }
  if (Array.isArray(data)) {
    return data.map(item => convertTimestamps(item));
  }
  if (typeof data === 'object' && data !== null) {
    const result: Record<string, any> = {};
    for (const key in data) {
      result[key] = convertTimestamps(data[key]);
    }
    return result;
  }
  return data;
};

// This function tells Next.js which forum pages to pre-render at build time.
// If you know your forum IDs in advance, you can list them here.
// For dynamic forums, we'll return an empty array to disable static generation.
export async function generateStaticParams() {
  // If you have a list of forum IDs you want to pre-render, return them here:
  // return [{ forumId: 'general' }, { forumId: 'announcements' }];
  
  // For dynamic forums, return an empty array and let the page handle it at request time
  return [];
}

// This allows dynamic parameters not explicitly defined in generateStaticParams
export const dynamicParams = true;

// Use a separate async function to handle the params
async function getForumData(forumId: string) {
  const postsSnapshot = await getDocs(collection(db, 'forums', forumId, 'posts'));
  return postsSnapshot;
}

interface PageProps {
  params: Promise<{ forumId: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function ForumPostsPage({
  params,
  searchParams,
}: PageProps) {
  // Await params as it's now a Promise in Next.js 15
  const { forumId } = await params;
  // Await searchParams if it exists
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  let initialPosts: Post[] = [];
  
  try {
    // Fetch initial posts on the server side
    const postsSnapshot = await getForumData(forumId);
    const postsData = postsSnapshot.docs.map(doc => {
      const data = doc.data();
      // Convert all Firestore timestamps to plain objects
      const convertedData = convertTimestamps(data);
      return {
        id: doc.id,
        ...convertedData,
        likes: convertedData.likes || [],
        comments: convertedData.comments || [],
      };
    });
    initialPosts = postsData as Post[];
  } catch (error) {
    console.error('Error fetching initial posts:', error);
  }

  return <ForumClient initialPosts={initialPosts} />;
}
