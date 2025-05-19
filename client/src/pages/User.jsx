import React, { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom';
import { IoHeartOutline } from "react-icons/io5";
import { FaUserPlus, FaUserMinus } from "react-icons/fa";
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const User = () => {
    const [currentUser, setCurrentUser] = useState(null);
    const { userId } = useParams(); // fixed destructuring
    const [isFollowing, setIsFollowing] = useState(false);
    const { user, loading } = useAuth();

    useEffect(() => {
        if (user && !loading) fetchUser();
    }, [user, loading]);

    useEffect(() => {
        if (currentUser) {
            setIsFollowing(currentUser.isFollowing); // backend should send this
        }
    }, [currentUser]);

    const fetchUser = async () => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_SERVER_URL}/public/get-user/${userId}`, {
                headers: {
                    Authorization: `Bearer ${user.token}`,
                },
            });
            setCurrentUser(res.data);
        } catch (error) {
            console.log(error.message);
            alert("Oops!");
        }
    };

    const handleFollowToggle = async () => {
        try {
            const res = await axios.post(
                `${import.meta.env.VITE_SERVER_URL}/public/follow/${userId}`,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${user.token}`,
                    },
                }
            );
            fetchUser()
        } catch (error) {
            console.error('Follow/unfollow error:', error.message);
        }
    };

    return (
        <>
            {currentUser &&
                <div className='w-full flex flex-col items-center gap-5 bg-white py-10 px-5 rounded-lg border relative'>
                    {/* Follow/Unfollow button */}
                    <div className='w-full flex items-center justify-end absolute right-5 gap-5'>
                        {user._id !== userId && (
                            <button
                                onClick={handleFollowToggle}
                                className='flex items-center justify-center gap-2 px-3 py-1 border-2 border-indigo-600 rounded-lg text-md font-medium text-indigo-600 active:scale-105 transition-all ease-out'
                            >
                                {isFollowing ? (
                                    <>
                                        <FaUserMinus className='text-xl' />
                                        <span>Unfollow</span>
                                    </>
                                ) : (
                                    <>
                                        <FaUserPlus className='text-xl' />
                                        <span>Follow</span>
                                    </>
                                )}
                            </button>
                        )}
                    </div>

                    {/* User info */}
                    <div className='w-full flex flex-col items-center gap-5'>
                        <div className='w-full flex items-center justify-start gap-5'>
                            <div className='w-[25%] flex flex-col items-center justify-center border-4 border-indigo-600 rounded-full'>
                                <img src={currentUser.avatar || '/profile.png'} className='w-full rounded-full' alt="" />
                            </div>
                            <div className='w-[75%] flex flex-col items-start gap-1 md:gap-3'>
                                <h1 className='text-md md:text-xl font-semibold text-indigo-600'>{currentUser.username}</h1>
                                <p className='text-sm md:text-lg text-gray-700 font-semibold'>{currentUser.name}</p>
                                <p className='text-sm md:text-md text-gray-700'>{currentUser.bio}</p>
                            </div>
                        </div>
                        <div className='w-full flex items-center justify-evenly gap-2 md:gap-8 text-gray-600 text-sm md:text-lg'>
                            <div className='flex items-center gap-2 bg-gray-100 px-2 py-1 rounded-lg border'>
                                <span className='font-semibold'>{currentUser.totalPosts}</span>
                                <span>Posts</span>
                            </div>
                            <div className='flex items-center gap-2 bg-gray-100 px-2 py-1 rounded-lg border'>
                                <span className='font-semibold'>{currentUser.followersCount}</span>
                                <span>Followers</span>
                            </div>
                            <div className='flex items-center gap-2 bg-gray-100 px-2 py-1 rounded-lg border'>
                                <span className='font-semibold'>{currentUser.followingCount}</span>
                                <span>Following</span>
                            </div>
                        </div>
                    </div>

                    <div className='w-full border'></div>

                    {/* Posts */}
                    <div className='w-full flex flex-col items-center gap-3'>
                        <h1 className='w-full font-medium text-gray-700'>Your Posts</h1>
                        {currentUser.posts.length === 0 ? (
                            <p className='text-gray-600 italic'>No post yet</p>
                        ) : (
                            <div className='w-full grid grid-cols-2'>
                                {currentUser.posts.map((item) => (
                                    <Link to={`/show-post/${item.id}`} key={item.id} className='relative'>
                                        <img src={item.images[0]} className='w-full aspect-square border hover:scale-105 transition ease-in-out' alt="" />
                                        <span className='absolute bottom-0 text-white px-3 py-2 bg-black/20 backdrop-blur-sm rounded-lg flex items-center gap-1'>
                                            <IoHeartOutline /> <span>{item.likeCount}</span>
                                        </span>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            }
        </>
    );
};

export default User;
