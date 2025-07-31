import NoAuthenticationPage from "../NoAuthenticationPage";

export default function NoAuthRoute({ searchParams }: { searchParams: { email?: string } }) {
  // Optionally get email from query string
  return <NoAuthenticationPage email={searchParams.email || ""} />;
}
