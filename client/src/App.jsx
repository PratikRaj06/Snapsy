import './App.css';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Profile from './pages/Profile';
import Home from './pages/Home';
import Notifications from './pages/Notifications';
import CreatePost from './pages/CreatePost';
import Explore from './pages/Explore';
import Login from './pages/Login';
import Register from './pages/Register';
import ViewPost from './pages/ViewPost';
import ShowPost from './pages/ShowPost';
import User from './pages/User';
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ExploreProvider } from './contexts/ExploreContext';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (!user && !loading) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Routes with Layout */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <ExploreProvider>
                  <Layout />
                </ExploreProvider>
              </ProtectedRoute>
            }
          >
            <Route index element={<Home />} />
            <Route path="profile" element={<Profile />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="create-post" element={<CreatePost />} />
            <Route path="view-post/:postId" element={<ViewPost />} />
            <Route path="show-post/:postId" element={<ShowPost />} />
            <Route path="/user/:userId" element={<User />} />
            <Route path="explore" element={<Explore />} />
          </Route>
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
