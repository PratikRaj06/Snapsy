import React, { useEffect, useState } from 'react';
import { MdDelete } from "react-icons/md";
import { FaArrowLeft } from "react-icons/fa6";
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import PostCard from '../components/PostCard';

const ViewPost = () => {
  const { postId } = useParams();
  const { user, loading } = useAuth();
  const [data, setData] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_SERVER_URL}/user/get-post/${postId}`, {
        headers: {
          Authorization: `Bearer ${user.token}`
        }
      });
      setData(res.data);
    } catch (error) {
      console.log(error.message);
    }
  };

  const deletePost = async () => {
    try {
      await axios.delete(`${import.meta.env.VITE_SERVER_URL}/user/delete-post/${postId}`, {
        headers: {
          Authorization: `Bearer ${user.token}`
        }
      });
      navigate('/profile');
    } catch (error) {
      console.error(error);
      alert("Failed to delete post");
    }
  };

  useEffect(() => {
    if (user && !loading) {
      fetchData();
    }
  }, [user, loading]);

  useEffect(() => {
    if (data && user && data.author) {
      if (data.author._id !== user.id) {
        navigate(-1);
      }
    }
  }, [data, user]);

  return (
    <div className='w-full flex flex-col items-center py-5'>
      <div className='w-full flex items-center justify-between pb-2'>
        <div className='flex items-center justify-start gap-2'>
          <Link to={'/profile'}>
            <FaArrowLeft className='text-xl' />
          </Link>
          <h1 className='text-lg font-semibold'>Post</h1>
        </div>
        <button
          onClick={() => setShowConfirm(true)}
          className='px-2 py-1 border border-red-500 bg-red-100 text-red-500 font-normal flex items-center justify-center gap-2 rounded-lg'
        >
          <MdDelete /><span>Delete</span>
        </button>
      </div>

      {data && <PostCard postData={data} />}

      {/* Delete confirmation popup */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-80 text-center shadow-xl">
            <h2 className="text-lg font-semibold mb-4">Delete this post?</h2>
            <p className="text-sm text-gray-600 mb-6">This action cannot be undone.</p>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 rounded-md border border-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={deletePost}
                className="px-4 py-2 rounded-md bg-red-500 text-white"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewPost;
