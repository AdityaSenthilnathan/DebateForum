import ProfilePage from "../../screens/ProfilePage";

export default function ProfileRoute() {
  // Next.js automatically provides params in the filename [userId]
  // ProfilePage already uses useParams, but you can pass userId as prop if you refactor
  return <ProfilePage />;
}
