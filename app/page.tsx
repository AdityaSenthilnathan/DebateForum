import React from 'react';
import { AuthProvider, useAuth } from './authContext';
import SignIn from './screens/SignIn';
import ForumPage from './screens/ForumPage';
import ProfilePage from './screens/ProfilePage';
import Layout from './layout'; // Import the Layout component
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';

const Page: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes />
      </Router>
    </AuthProvider>
  );
};

const Routes: React.FC = () => {
  const { currentUser, loading } = useAuth();

  if (loading) return <div>Loading...</div>; // Show loading state while checking auth

  return (
    <Layout> {/* Wrap routes with Layout */}
      <Switch>
        {!currentUser ? (
          <Route path="/" exact>
            <SignIn />
          </Route>
        ) : (
          <>
            <Route path="/" exact>
              <ForumPage />
            </Route>
            <Route path="/profile/:userId" component={ProfilePage} />
          </>
        )}
      </Switch>
    </Layout>
  );
};

export default Page;
