import ProfilePage from "../../screens/ProfilePage";
import { useParams } from "next/navigation";

export default function ProfileRoute() {
  // Next.js automatically provides params in the filename [userId]
  // ProfilePage already uses useParams, but you can pass userId as prop if you refactor
  return <ProfilePage />;
}
