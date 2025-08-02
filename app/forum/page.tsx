"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { CardHeader } from "@/components/ui/card";
import { CardTitle } from "@/components/ui/card";
import { CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { NavigationBar } from '../screens/ForumPage';

const FORUMS = [
  "Lincoln-Douglas",
  "Parliamentary",
  "Policy",
  "Public Forum",
];

export default function ForumListPage() {
  const router = useRouter();
  const [forumPostCounts, setForumPostCounts] = useState<{ [key: string]: number }>(
    {}
  );
  const [user] = useState(null); // User state (currently unused)

  useEffect(() => {
    const fetchForumPostCounts = async () => {
      const counts = await Promise.all(
        FORUMS.map(async (forum) => {
          const postsRef = collection(db, "forums", forum, "posts");
          const snapshot = await getDocs(postsRef);
          return { [forum]: snapshot.size };
        })
      );
      setForumPostCounts(Object.assign({}, ...counts));
    };
    fetchForumPostCounts();
  }, []);

  const handleSignOut = () => {};

  return (
    <div className="min-h-screen bg-gray-100">
      <NavigationBar user={user} handleSignOut={handleSignOut} />
      <div className="container mx-auto px-4 py-8">
        <h2 className="text-3xl font-bold mb-6">Debate Forums</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FORUMS.map((format) => (
            <Card key={format}>
              <CardHeader>
                <CardTitle>{format}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <span>{forumPostCounts[format] || 0} posts</span>
                  <Button
                    variant="outline"
                    onClick={() =>
                      router.push(`/forum/${encodeURIComponent(format)}`)
                    }
                  >
                    View Forum
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
