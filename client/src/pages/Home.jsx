import React, { useEffect, useState } from 'react'
import PostCard from '../components/PostCard'
import { useAuth } from '../contexts/AuthContext'
import axios from 'axios'

const Home = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchFeedPosts = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_SERVER_URL}/user/get-feed-posts`, {
        headers: {
          Authorization: `Bearer ${user.token}`
        }
      });
      setPosts(res.data);
    } catch (error) {
      console.error("Error fetching feed posts:", error.message);
      alert("Failed to load feed!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchFeedPosts();
    }
  }, [user]);

  return (
    <div className='w-full flex flex-col items-center gap-5 px-4 py-6'>
      {loading ? (
        <p className='text-gray-500'>Loading posts...</p>
      ) : posts.length === 0 ? (
        <p className='text-gray-500 italic'>No posts to show. Follow some users!</p>
      ) : (
        posts.map((item) => (
          <PostCard key={item._id} postData={item} />
        ))
      )}
    </div>
  )
}

export default Home
