import React, { useState, useRef, useEffect } from 'react'
import { Formik, Form, Field, ErrorMessage } from 'formik';
import { RiImageAddLine } from "react-icons/ri";
import { Link, useNavigate } from 'react-router-dom';
import { IoHeartOutline } from "react-icons/io5";
import { HiOutlineDotsVertical } from "react-icons/hi";
import { IoIosLogOut } from "react-icons/io";
import { FiEdit2 } from "react-icons/fi";
import { IoBookmarkOutline } from "react-icons/io5";
import { IoClose } from "react-icons/io5";
import { IoMdAddCircleOutline } from "react-icons/io";
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { storage } from '../appwriteConfig';
import { ID } from 'appwrite';

const Profile = () => {
  const navigate = useNavigate()
  const [editing, setEditing] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [likedPop, setLikedPop] = useState(false);
  const [savedPop, setSavedPop] = useState(false);
  const [menuPop, setMenuPop] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [logOutPop, seLogOutPop] = useState(false)
  const [likedPosts, setLikedPosts] = useState([]);
  const [savedPosts, setSavedPosts] = useState([]);
  const { user, setUser, loading } = useAuth()
  const fileInputRef = useRef();
  const menuRef = useRef();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuPop(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    console.log("User:", user)
    if (user && !loading) fetchUser();
  }, [user, loading])

  useEffect(() => {
    console.log("Current user: ", currentUser)
    if (currentUser && (currentUser.avatar || currentUser.profileImage)) {
      setPreviewImage(currentUser.avatar || currentUser.profileImage);
    }
  }, [currentUser]);

  const fetchUser = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_SERVER_URL}/user/myprofile`, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      })
      setCurrentUser(res.data);
    } catch (error) {
      console.log(error)
      alert("Oops!")
    }
  }

  const logOut = () => {
    setUser(null);
    localStorage.removeItem("user")
    navigate('/login')
  }

  const uploadImageToAppwrite = async (file) => {
    let attempts = 0;
    let uploaded = false;
    let fileURL = null;

    while (attempts < 3 && !uploaded) {
      try {
        const response = await storage.createFile(
          import.meta.env.VITE_APPWRITE_BUCKET_ID,
          ID.unique(),
          file
        );

        fileURL = storage.getFileView(
          import.meta.env.VITE_APPWRITE_BUCKET_ID,
          response.$id
        );

        uploaded = true;
      } catch (error) {
        console.error(`Upload failed (attempt ${attempts + 1}) for file ${file.name}:`, error);
        attempts++;
        if (attempts >= 3) {
          throw new Error(`Failed to upload image after 3 attempts.`);
        }
      }
    }

    return fileURL;
  };

  const validate = (values) => {
    const errors = {};
    if (!values.name.trim()) errors.name = 'Name is required';
    else if (values.name.trim().length < 3) errors.name = 'Minimum 3 characters.';
    if (!values.bio.trim()) errors.bio = 'Bio is required';
    return errors;
  };

  const handleSubmit = async (values, { setSubmitting, setStatus }) => {
    if (
      values.name === currentUser.name &&
      values.bio === currentUser.bio &&
      !values.profileImage
    ) {
      setStatus({ error: 'No changes to save.' });
      setSubmitting(false);
      return;
    }
    try {
      setStatus(null); // Clear any previous messages
      let payload = {
        name: values.name,
        bio: values.bio,
      };

      if (values.profileImage) {
        const uploadedUrl = await uploadImageToAppwrite(values.profileImage);
        payload.avatar = uploadedUrl;
      }

      await axios.put(
        `${import.meta.env.VITE_SERVER_URL}/user/edit-profile`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );

      setStatus({ success: 'Profile updated!' });
      setEditing(false);
      fetchUser();
    } catch (error) {
      console.log(error);
      setStatus({ error: error.response?.data?.message || 'Failed to update profile.' });
    } finally {
      setMenuPop(false)
      setSubmitting(false);
    }
  };

  const getLikedPosts = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_SERVER_URL}/user/liked-posts`, {
        headers: {
          Authorization: `Bearer ${user.token}`
        }
      });
      console.log("data: ", res.data)
      setLikedPosts(res.data);
    } catch (err) {
      console.error('Failed to fetch liked posts:', err.message);
      throw err;
    }
  };

  const getSavedPosts = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_SERVER_URL}/user/saved-posts`, {
        headers: {
          Authorization: `Bearer ${user.token}`
        }
      });
      setSavedPosts(res.data);
    } catch (err) {
      console.error('Failed to fetch liked posts:', err);
      throw err;
    }
  };

  useEffect(() => {
    if (savedPop) getSavedPosts()
  }, [savedPop])

  useEffect(() => {
    if (likedPop) getLikedPosts()
  }, [likedPop])

  return (
    <>

      {editing && <div className='relative w-full flex flex-col items-center gap-5 bg-white border rounded-lg px-5 py-10'>
        <h1 className='text-2xl font-semibold text-indigo-600'>Edit your Profile</h1>

        <Formik
          initialValues={{
            name: currentUser?.name || '',
            bio: currentUser?.bio || '',
            profileImage: null
          }}
          enableReinitialize
          validate={validate}
          onSubmit={handleSubmit}
          validateOnChange={true}
          validateOnBlur={true}
        >
          {({ setFieldValue, isSubmitting, status }) => (
            <Form className='w-full flex flex-col gap-5'>

              {/* Profile Image */}
              <div className='flex flex-col items-center gap-5 w-full'>
                {previewImage && (
                  <img
                    src={previewImage}
                    className='w-64 rounded-full object-cover border-2 border-indigo-400'
                  />
                )}
                <input
                  type='file'
                  accept='image/*'
                  hidden
                  ref={fileInputRef}
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      setFieldValue('profileImage', file);
                      setPreviewImage(URL.createObjectURL(file));
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current.click()}
                  className='bg-indigo-100 text-indigo-600 px-4 py-2 rounded-md hover:bg-indigo-200 transition flex items-center justify-center gap-2'
                > <RiImageAddLine />
                  {previewImage ? 'Change Image' : 'Add Image'}
                </button>
              </div>

              {/* Fullname */}
              <div className='w-full flex flex-col items-start gap-1'>
                <label className='text-gray-600'>Name</label>
                <Field
                  name="name"
                  type="text"
                  className='w-full px-3 py-2 border border-indigo-400 rounded-md bg-indigo-50 focus:outline-none'
                />
                <ErrorMessage name="name" component="div" className='text-red-500 text-sm' />
              </div>

              {/* Bio */}
              <div className='w-full flex flex-col items-start gap-1'>
                <label className='text-gray-600'>Bio</label>
                <Field
                  as="textarea"
                  name="bio"
                  rows={3}
                  className='w-full px-3 py-2 border border-indigo-400 rounded-md bg-indigo-50 focus:outline-none resize-none'
                />
                <ErrorMessage name="bio" component="div" className='text-red-500 text-sm' />
              </div>
              {status?.error && <p className="w-full text-center text-red-500">{status.error}</p>}
              {/* Submit Button */}
              <div className='w-full flex items-center justify-center gap-5'>
                <button onClick={() => setEditing(false)}
                  type="button"
                  className='w-full bg-gray-200 py-2 rounded-lg hover:bg-gray-300 transition border border-gray-600 text-gray-600'
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className='w-full bg-indigo-500 text-white py-2 rounded-lg hover:bg-indigo-600 transition'
                >
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </Form>
          )}
        </Formik>
      </div>}

      {logOutPop && <div className='w-full min-h-screen flex items-center justify-center bg-black/10 backdrop-blur-sm absolute z-30 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-5'>
        <div className='flex flex-col items-center bg-white gap-10 px-5 py-10 rounded-xl border drop-shadow-xl'>
          <h1 className='text-2xl font-semibold text-indigo-600'>Logout User</h1>
          <p className='text-lg font-light text-gray-600'>Are you sure you want to log out of your account?</p>
          <div className='w-full flex items-center justify-center gap-5'>
            <button onClick={() => seLogOutPop(false)} className='px-5 py-2 border rounded-lg font-medium text-md bg-gray-200 border-gray-500 text-gray-700 hover:bg-gray-300 active:bg-gray-400'>Cancel</button>
            <button onClick={logOut} className='px-5 py-2 border rounded-lg font-medium text-md text-white bg-red-500 hover:bg-red-600 active:bg-red-500'>Logout</button>
          </div>
        </div>


      </div>}
      {currentUser && !editing &&
        <div className='w-full flex flex-col items-center gap-5 bg-white py-10 px-5 rounded-lg border relative'>
          <div className='w-full flex items-center justify-end absolute right-5 gap-5'>
            <Link to={'/create-post'} className='flex items-center justify-center text-indigo-600 rounded-md'><IoMdAddCircleOutline className='text-3xl' /></Link>
            <button onClick={() => setMenuPop(true)} className='flex items-center justify-center text-indigo-600 rounded-md'><HiOutlineDotsVertical className='text-3xl' /></button>
          </div>

          {menuPop && <div ref={menuRef} className='p-5 border rounded-lg bg-white absolute z-50 right-5 top-20 flex flex-col items-start gap-2'>
            <button onClick={() => {
              setEditing(true)
              setMenuPop(false)
            }} className='flex items-center justify-start gap-2 text-gray-600 rounded-md hover:bg-gray-100 w-full px-2 py-1'><FiEdit2 className='text-xl' /> <span className='text-md'>Edit Profie</span></button>
            <button onClick={() => {
              setSavedPop(true)
              setMenuPop(false)
            }
            } className='flex items-center justify-start gap-2 text-gray-600 rounded-md hover:bg-gray-100 w-full px-2 py-1'><IoBookmarkOutline className='text-xl' /> <span className='text-md'>Saved Posts</span></button>
            <button onClick={() => {
              setLikedPop(true)
              setMenuPop(false)
            }
            } className='flex items-center justify-start gap-2 text-gray-600 rounded-md hover:bg-gray-100 w-full px-2 py-1'><IoHeartOutline className='text-xl' /> <span className='text-md'>Liked Posts</span></button>
            <button onClick={() => {
              seLogOutPop(true)
              setMenuPop(false)
            }} className='flex items-center justify-start gap-2 text-gray-600 rounded-md hover:bg-gray-100 w-full px-2 py-1'><IoIosLogOut className='text-xl' /> <span className='text-md'>Log Out</span></button>

          </div>}
          <div className='w-full flex flex-col items-center gap-5'>
            <div className='w-full flex items-center justify-start gap-5'>
              <div className='w-[25%] flex flex-col items-center justify-center border-4 border-indigo-600 rounded-full'>
                <img src={currentUser.avatar ? currentUser.avatar : '/profile.png'} className='w-full rounded-full' alt="" />
              </div>
              <div className='w-[75%] flex flex-col items-start gap-1 md:gap-3'>
                <h1 className='text-md md:text-xl font-semibold text-indigo-600'>{currentUser.username}</h1>
                <p className='text-sm md:text-lg text-gray-700 font-semibold text-center'>{currentUser.name}</p>
                <p className='text-sm md:text-md text-gray-700 font-normal'>{currentUser.bio}</p>
              </div>
            </div>
            <div className='w-full flex items-center justify-evenly gap-2 md:gap-8 text-gray-600 text-sm md:text-lg'>
              <div className='flex items-center justify-center gap-2 bg-gray-100 px-2 py-1 rounded-lg border'>
                <span className='font-semibold text-sm md:text-lg'>{currentUser.totalPosts}</span>
                <span className='text-xs md:text-lg'>Posts</span>
              </div>
              <div className='flex items-center justify-center gap-2 bg-gray-100 px-2 py-1 rounded-lg border'>
                <span className='font-semibold text-sm md:text-lg'>{currentUser.followersCount}</span>
                <span className='text-xs md:text-lg'>Followers</span>
              </div>
              <div className='flex items-center justify-center gap-2 bg-gray-100 px-2 py-1 rounded-lg border'>
                <span className='font-semibold text-sm md:text-lg'>{currentUser.followingCount}</span>
                <span className='text-xs md:text-lg'>Following</span>
              </div>
            </div>
          </div>

          <div className='w-full border'></div>

          {savedPop && <div className='w-full max-h-96 overflow-y-auto flex flex-col items-center p-5 rounded-lg bg-white border gap-5 z-20'>
            <div className='w-full flex items-center justify-between'>
              <h1>Saved Posts</h1>
              <button onClick={() => setSavedPop(false)}><IoClose className='text-2xl' /></button>
            </div>
            {savedPosts.length === 0 ? <p>No posts</p> : <div className='w-full grid grid-cols-2'>
              {savedPosts.map((item) => <Link to={`/show-post/${item.id}`} className='w-full flex flex-col items-start relative'>
                <img src={item.images[0]} className='w-full aspect-square border hover:scale-105 transition ease-in-out' alt="" />
                <span className='flex items-center justify-start gap-1 absolute bottom-0 text-white px-2 py-1 m-1 bg-black/20 backdrop-blur-sm rounded-lg'><IoHeartOutline /> <span>{item.likeCount}</span> </span>
              </Link>)}

            </div>}
          </div>}

          {likedPop && <div className='w-full max-h-96 flex flex-col items-center p-5 rounded-lg bg-white border gap-5 z-20 overflow-y-auto'>
            <div className='w-full flex items-center justify-between'>
              <h1>Liked Posts</h1>
              <button onClick={() => setLikedPop(false)}><IoClose className='text-2xl' /></button>
            </div>
            {likedPosts.length === 0 ? <p>No posts</p> : <div className='w-full grid grid-cols-2'>
              {likedPosts.map((item) => <Link to={`/show-post/${item.id}`} className='w-full flex flex-col items-start relative'>
                <img src={item.images[0]} className='w-full aspect-square border hover:scale-105 transition ease-in-out' alt="" />
                <span className='flex items-center justify-start gap-1 absolute bottom-0 text-white px-2 py-1 m-1 bg-black/20 backdrop-blur-sm rounded-lg'><IoHeartOutline /> <span>{item.likeCount}</span> </span>
              </Link>)}

            </div>}
          </div>}

          <div className='w-full flex flex-col items-center gap-3'>
            <h1 className='w-full font-medium text-gray-700'>Your Posts</h1>
            {currentUser.posts.length === 0 ? <p className='text-gray-600 italic'>No post yet</p> :
              <div className='w-full grid grid-cols-2 gap-1'>
                {currentUser.posts.map((item) => (
                  <Link
                    to={`/view-post/${item.id}`}
                    key={item.id}
                    className='w-full flex flex-col items-start relative group'
                  >
                    <div className='w-full aspect-square overflow-hidden rounded'>
                      <img
                        src={item.images[0]}
                        alt=""
                        className='w-full h-full object-cover transform transition-transform duration-300 ease-in-out group-hover:scale-110'
                      />
                    </div>
                    <span className='flex items-center justify-start gap-1 absolute bottom-0 text-white px-2 py-1 m-1 bg-black/20 backdrop-blur-sm rounded-lg'>
                      <IoHeartOutline /> <span>{item.likeCount}</span>
                    </span>
                  </Link>
                ))}
              </div>

            }
          </div>
        </div>
      }

    </>
  )
}

export default Profile