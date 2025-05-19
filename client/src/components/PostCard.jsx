import React, { useEffect, useState } from 'react'
import ImageSlider from './ImageSlider'
import { IoBookmark, IoBookmarkOutline } from "react-icons/io5";
import { IoHeart, IoHeartOutline } from "react-icons/io5";
import { IoChatbubbleOutline, IoChatbubble } from "react-icons/io5";
import { AiOutlineDelete } from "react-icons/ai";
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { IoSend } from "react-icons/io5";

const PostCard = ({ postData }) => {
    const { user, loading } = useAuth()
    const [liked, setLiked] = useState(postData.isLiked);
    const [likeCount, setLikeCount] = useState(postData.likeCount);
    const [processing, setProcessing] = useState(false);
    const [saved, setSaved] = useState(postData.isSaved);
    const [commentsOpen, setCommentsOpen] = useState(false);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');

    function timeAgo(dateString) {
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

    const handleLikeToggle = async () => {
        if (processing) return;
        setProcessing(true);
        try {
            const res = await axios.post(`${import.meta.env.VITE_SERVER_URL}/public/like-unlike/${postData._id}`, {}, {
                headers: {
                    Authorization: `Bearer ${user.token}`
                }
            });

            // Toggle state
            setLiked(prev => !prev);
            setLikeCount(res.data.likeCount);
        } catch (err) {
            console.error('Like error', err);
        } finally {
            setProcessing(false);
        }
    };

    const handleSaveToggle = async () => {
        if (processing) return;
        setProcessing(true);

        try {
            const res = await axios.post(`${import.meta.env.VITE_SERVER_URL}/public/save-unsave/${postData._id}`, {}, {
                headers: {
                    Authorization: `Bearer ${user.token}`
                }
            });

            setSaved(res.data.saved);
        } catch (err) {
            console.error('Save error', err.response?.data || err.message);
        } finally {
            setProcessing(false);
        }
    };

    useEffect(() => {
        if (user && !processing) getComments(postData._id)
    }, [])

    const getComments = async (postId) => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_SERVER_URL}/public/get-comments/${postId}`,
                {
                    headers: {
                        Authorization: `Bearer ${user.token}`,
                    },
                }
            );
            console.log("Comments: ", res.data)
            setComments(res.data);
        } catch (err) {
            console.error('Error fetching comments:', err);
            throw err?.response?.data || { message: 'Something went wrong' };
        }
    };

    const addComment = async () => {
        try {
            if (!newComment.trim()) return;
            const res = await axios.post(
                `${import.meta.env.VITE_SERVER_URL}/public/add-comment`,
                {
                    postId: postData._id,
                    text: newComment
                },
                {
                    headers: {
                        Authorization: `Bearer ${user.token}`,
                    },
                }
            );
            setNewComment('');
            getComments(postData._id)
        } catch (err) {
            console.error('Error adding comment:', err.message)
        }
    };

    const deleteComment = async (commentId) => {
        try {
            const res = await axios.delete(`${import.meta.env.VITE_SERVER_URL}/public/delete-comment/${commentId}`, {
                headers: {
                    Authorization: `Bearer ${user.token}`,
                },
            });
            getComments(postData._id)
        } catch (err) {
            console.error('Error deleting comment:', err);
            throw err?.response?.data || { message: 'Something went wrong' };
        }
    };

    return (
        <div className='w-full flex flex-col items-center bg-white border p-5 rounded-lg gap-5'>
            <div className='w-full flex items-center justify-between gap-5'>
                <Link to={`/user/${postData.author._id}`} className='w-full flex items-center justify-start gap-5'>
                    <img src={postData.author.avatar} alt="" className='h-10 border-2 border-indigo-500 rounded-full' />
                    <p className='font-normal text-lg text-gray-700'>{postData.author.username}</p>
                </Link>

            </div>
            <ImageSlider images={postData.images} />
            <div className='w-full flex items-center justify-between gap-5'><p className=''>{postData.caption}</p> <span className='text-sm text-gray-600'>{timeAgo(postData.createdAt)}</span></div>
            <div className='w-full flex items-center justify-start gap-2 text-sm text-gray-500'>{postData.hashtags.map((item, i) => <span key={i}>#{item}</span>)}
            </div>
            <div className='w-full flex items-center justify-between gap-5  text-indigo-700'>
                <div className='flex items-center justify-start gap-5'>
                    <button className='flex items-center justify-start gap-2' onClick={handleLikeToggle}>{liked ? <IoHeart className='text-2xl' /> : <IoHeartOutline className='text-2xl' />} <span className='text-md'>{likeCount} likes</span></button>
                    <button className='flex items-center justify-start gap-2' onClick={() => setCommentsOpen(!commentsOpen)}>{commentsOpen ? <IoChatbubble className='text-2xl' /> : <IoChatbubbleOutline className='text-2xl' />} <span className='text-md'>{comments.length} comments</span></button>
                </div>
                <button onClick={handleSaveToggle}>{saved ? <IoBookmark className='text-2xl' /> : <IoBookmarkOutline className='text-2xl' />}</button>
            </div>
            {commentsOpen && <div className='w-full border p-2 rounded-md flex flex-col items-center gap-3'>
                <h1 className='text-md text-gray-700 pb-2 font-bold w-full'>Comments</h1>
                {comments.length === 0 && <p className='font-light italic text-gray-600'>No comments</p>}
                {comments.length > 0 && comments.map(comment => (
                    <div key={comment._id} className='w-full flex items-center gap-2'>
                        <img src={comment.user.avatar} alt="" className='h-8 rounded-full' />
                        <div className='w-full flex flex-col items-start gap-1'>
                            <div className='w-full flex items-center justify-between'>
                                <h2 className='text-md font-medium'>{comment.user.username}</h2>
                                <span className='text-xs font-normal text-gray-600'>{timeAgo(comment.timestamp)}</span>
                            </div>
                            <div className='w-full flex items-center justify-between'>
                                <p className='text-sm font-light text-gray-600'>{comment.text}</p>
                                {comment.user._id === user.id &&
                                    <button
                                        onClick={() => deleteComment(comment._id)}
                                        className='p-1 rounded-md bg-red-100 text-red-500'
                                    >
                                        <AiOutlineDelete />
                                    </button>}
                            </div>
                        
                        </div>

                    </div>
                ))}

                <div className='w-full flex items-center justify-between gap-1 p-1 rounded-full border-indigo-300 border pl-3'>
                    <input type="text" value={newComment} onChange={(e) => setNewComment(e.target.value)} className='w-full focus:outline-none p-1 rounded-full bg-transparent' placeholder='Comment' />
                    <button
                        onClick={() => addComment(postData._id, newComment.trim())}
                        className='pl-4 pr-3 py-2 bg-indigo-600 text-white text-lg rounded-full active:bg-indigo-700'
                    >
                        <IoSend />
                    </button>

                </div>

            </div>}
        </div>
    )
}

export default PostCard