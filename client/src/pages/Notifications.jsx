import React, { useEffect, useState } from 'react';
import { FaHeart, FaComment, FaUserPlus } from 'react-icons/fa';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';

const timeAgo = (dateString) => {
  const now = new Date();
  const past = new Date(dateString);
  const seconds = Math.floor((now - past) / 1000);

  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return minutes === 1 ? "1 minute ago" : `${minutes} minutes ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return hours === 1 ? "1 hour ago" : `${hours} hours ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return days === 1 ? "1 day ago" : `${days} days ago`;

  const weeks = Math.floor(days / 7);
  if (weeks < 4) return weeks === 1 ? "1 week ago" : `${weeks} weeks ago`;

  const months = Math.floor(days / 30);
  if (months < 12) return months === 1 ? "1 month ago" : `${months} months ago`;

  const years = Math.floor(days / 365);
  return years === 1 ? "1 year ago" : `${years} years ago`;
}

const getIcon = (type) => {
  switch (type) {
    case 'like':
      return <FaHeart className="text-red-500" />;
    case 'comment':
      return <FaComment className="text-indigo-500" />;
    case 'follow':
      return <FaUserPlus className="text-green-500" />;
    default:
      return null;
  }
};

const Notifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);

  const fetchNotifications = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_SERVER_URL}/user/notifications`, {
        headers: {
          Authorization: `Bearer ${user.token}`
        }
      });
      setNotifications(res.data);
    } catch (error) {
      console.log('Error fetching notifications:', error.message);
    }
  };

  useEffect(() => {
    if (user) fetchNotifications();
  }, [user]);

  return (
    <div className="w-full bg-white p-5 rounded-lg shadow-md border">
      <h2 className="text-xl font-semibold text-indigo-600 mb-4">Notifications</h2>

      {notifications.length === 0 ? (
        <p className="text-gray-500 text-sm text-center">No notifications yet.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {notifications.map((note) => {
            const { _id, type, from, post, createdAt } = note;
            const message =
              type === 'like'
                ? 'liked your post.'
                : type === 'comment'
                ? 'commented on your post.'
                : 'followed you.';

            const link =
              type === 'follow'
                ? `/user/${from._id}`
                : `/show-post/${post?._id}`;

            return (
              <li
                key={_id}
                className="flex items-center gap-4 p-3 border border-indigo-100 rounded-lg hover:bg-indigo-50 transition"
              >
                <Link to={link} className="flex items-center gap-4 w-full">
                  <img
                    src={from.avatar}
                    alt={from.username}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div className="text-xl">{getIcon(type)}</div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-800">
                      <span className="font-semibold">{from.username}</span> {message}
                    </p>
                    <span className="text-xs text-gray-400">
                    {timeAgo(createdAt)}
                    </span>
                  </div>
                  {post?.images?.[0] && type !== 'follow' && (
                    <img
                      src={post.images[0]}
                      alt="Post"
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default Notifications;
