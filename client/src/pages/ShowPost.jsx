import React, { useEffect, useState } from 'react'
import { FaArrowLeft } from "react-icons/fa6";
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import PostCard from '../components/PostCard';

const ShowPost = () => {
    const { postId } = useParams();
    const { user, loading } = useAuth();
    const [data, setData] = useState(null);
    const navigate = useNavigate();

    const fetchData = async () => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_SERVER_URL}/user/get-post/${postId}`, {
                headers: {
                    Authorization: `Bearer ${user.token}`
                }
            })
            setData(res.data)
        } catch (error) {
            console.log(error.message)
        }
    }

    useEffect(() => {
        if (user && !loading) {
            fetchData()
        }
    }, [user, loading])

    return (
        <div className='w-full flex flex-col items-center py-5'>

            <div className='w-full flex items-center justify-start gap-2 pb-2'>
                <button onClick={() => navigate(-1)}>
                    <FaArrowLeft className='text-xl' />
                </button>
                <h1 className='text-lg font-semibold'>Post</h1>
            </div>


            {data && <PostCard postData={data} />}
        </div>
    )
}

export default ShowPost