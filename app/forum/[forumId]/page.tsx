import { db } from '@/app/firebaseConfig';
import { collection, getDocs, Timestamp, QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';
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
    console.log(`Fetching posts for forum: ${forumId}`);
    // Fetch initial posts on the server side
    const postsSnapshot = await getForumData(forumId);
    
    if (!postsSnapshot) {
      console.error('No posts snapshot returned from getForumData');
      throw new Error('Failed to fetch forum data');
    }

    // Define the expected shape of the document data
    interface PostDocumentData {
      title: string;
      content: string;
      userEmail: string;  // Required by Post interface
      createdAt: { seconds: number }; // Firestore timestamp format
      likes: string[];    // Required by Post interface
      comments: Array<{   // Required by Post interface
        id: string;
        content: string;
        userEmail: string;
        createdAt: { seconds: number };
        replies?: Array<{
          id: string;
          content: string;
          userEmail: string;
          createdAt: { seconds: number };
        }>;
      }>;
    }

    // Define comment interface for type safety
    interface CommentData {
      id: string;
      content: string;
      userEmail: string;
      createdAt: { seconds: number };
      replies?: Array<{
        id: string;
        content: string;
        userEmail: string;
        createdAt: { seconds: number };
      }>;
    }

    // First, process all documents and collect valid posts
    const processedPosts = postsSnapshot.docs.map((doc: { id: string; exists: () => boolean; data: () => DocumentData }) => {
      try {
        if (!doc.exists()) {
          console.warn(`Document ${doc.id} does not exist`);
          return null;
        }
        
        const data = doc.data();
        if (!data) {
          console.warn(`No data in document ${doc.id}`);
          return null;
        }
        
        // Type assertion with runtime validation
        const postData = data as PostDocumentData;
        if (!postData.title || !postData.content || !postData.userEmail) {
          console.warn(`Missing required fields in document ${doc.id}`);
          return null;
        }
        
        // Convert all Firestore timestamps to plain objects
        const convertedData = convertTimestamps(postData);
        
        // Create post object that matches the Post interface
        const post: Post = {
          id: doc.id,
          title: postData.title,
          content: postData.content,
          userEmail: postData.userEmail,
          createdAt: convertedData.createdAt || { seconds: Math.floor(Date.now() / 1000) },
          likes: Array.isArray(postData.likes) ? postData.likes : [],
          comments: Array.isArray(postData.comments) 
            ? (postData.comments as CommentData[]).map((comment: CommentData) => ({
                id: comment.id,
                content: comment.content,
                userEmail: comment.userEmail,
                createdAt: comment.createdAt,
                replies: Array.isArray(comment.replies) 
                  ? comment.replies.map((reply) => ({
                      id: reply.id,
                      content: reply.content,
                      userEmail: reply.userEmail,
                      createdAt: reply.createdAt
                    }))
                  : []
              }))
            : []
        };
        
        return post;
      } catch (docError) {
        console.error(`Error processing document ${doc.id}:`, docError);
        return null;
      }
    });
    
    // Filter out null values and ensure type safety
    initialPosts = processedPosts.filter((post): post is Post => post !== null);
    console.log(`Successfully loaded ${initialPosts.length} posts for forum: ${forumId}`);
  } catch (error) {
    console.error('Error in ForumPostsPage:', error);
    // Re-throw the error to trigger the error boundary
    throw new Error(`Failed to load forum: ${error instanceof Error ? error.message : String(error)}`);
  }

  return <ForumClient initialPosts={initialPosts} />;
}
