import React, { useRef, useState } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import MultiSelectDropdown from '../components/MultiSelectDropdown';
import ImageSlider from '../components/ImageSlider';
import { RiImageAddLine } from "react-icons/ri";
import { storage } from '../appwriteConfig';
import { ID } from 'appwrite';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';


const CreatePost = () => {
  const { user } = useAuth()
  const fileInputRef = useRef();
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showPopup, setShowPopup] = useState(false);
  const [failure, setFailure] = useState(false)

  const initialValues = {
    caption: '',
    images: [],
    hashtags: []
  };

  const validate = (values) => {
    const errors = {};
    if (!values.images || values.images.length === 0) {
      errors.images = 'At least one image is required';
    }
    if (!values.hashtags || values.hashtags.length === 0) {
      errors.hashtags = 'Select at least one hashtag';
    }
    return errors;
  };

  const uploadImagesToAppwrite = async (files) => {
    const uploadedURLs = [];
    setUploading(true);
    setProgress(0);

    // Smoothly animate progress from 0 to 90%
    const fakeProgress = () => {
      let percent = 0;
      const interval = setInterval(() => {
        percent += Math.random() * 5; // Add 1–5% per tick
        if (percent < 90) {
          setProgress(Math.floor(percent));
        } else {
          clearInterval(interval);
        }
      }, 200);
      return interval;
    };

    const progressInterval = fakeProgress();

    for (let i = 0; i < files.length; i++) {
      let attempts = 0;
      let uploaded = false;
      let fileURL = null;

      while (attempts < 3 && !uploaded) {
        try {
          const response = await storage.createFile(
            import.meta.env.VITE_APPWRITE_BUCKET_ID,
            ID.unique(),
            files[i]
          );

          fileURL = storage.getFileView(import.meta.env.VITE_APPWRITE_BUCKET_ID, response.$id);
          uploaded = true;
          uploadedURLs.push(fileURL);
        } catch (error) {
          console.error(`Upload failed (attempt ${attempts + 1}) for file ${files[i].name}:`, error);
          attempts++;
          if (attempts >= 3) {
            alert(`Failed to upload image: ${files[i].name} after 3 attempts.`);
          }
        }
      }
    }

    clearInterval(progressInterval);
    setProgress(100);

    setTimeout(() => {
      setUploading(false);
      setProgress(0); // Optional: reset progress bar
    }, 500);

    return uploadedURLs;
  };



  const handleSubmit = async (values, { resetForm }) => {
    setFailure(false);

    try {
      const imageURLs = await uploadImagesToAppwrite(values.images);

      const formattedData = {
        caption: values.caption,
        images: imageURLs,
        hashtags: values.hashtags.map(tag => tag.trim().toLowerCase())
      };

      await axios.post(
        `${import.meta.env.VITE_SERVER_URL}/user/create-post`,
        formattedData,
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );

      setShowPopup(true);
      setTimeout(() => setShowPopup(false), 3000);
      resetForm();
    } catch (error) {
      setFailure(true);
      console.error("Error submitting post:", error.message);
    }
  };



  return (
    <div className='w-full flex flex-col items-center gap-5 p-5 bg-white drop-shadow-xl border rounded-lg my-5'>
      <h1 className='text-2xl font-semibold text-indigo-600'>Create Post</h1>



      {showPopup && (
        <div className="w-full bg-green-100 text-green-700 text-center py-2 rounded">
          ✅ Post uploaded successfully!
        </div>
      )}

      <Formik
        initialValues={initialValues}
        validate={validate}
        onSubmit={handleSubmit}
        validateOnChange={true}
        validateOnBlur={true}
      >
        {({ setFieldValue, values, errors, submitCount }) => (
          <Form className='w-full flex flex-col gap-8'>

            {/* Image Upload */}
            <div className='flex flex-col items-start gap-2'>
              <span className='text-gray-600 text-md'>Select Images</span>

              <input
                type="file"
                multiple
                hidden
                ref={fileInputRef}
                onChange={(e) => {
                  const files = Array.from(e.target.files);
                  setFieldValue("images", files);
                }}
              />

              {values.images.length > 0 ? (
                <>
                  <ImageSlider images={values.images.map(file => URL.createObjectURL(file))} />
                  <button
                    type="button"
                    className='mt-2 px-3 py-1 bg-red-100 text-red-600 text-sm rounded hover:bg-red-200'
                    onClick={() => setFieldValue("images", [])}
                  >
                    Remove
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current.click()}
                  className='w-full bg-indigo-50 flex items-center justify-center py-20 border border-indigo-400 rounded-lg text-indigo-500 text-5xl'
                >
                  <RiImageAddLine />
                </button>
              )}

              {submitCount > 0 && errors.images && (
                <div className='text-red-500 text-sm'>{errors.images}</div>
              )}
            </div>

            {/* Caption */}
            <div className='flex flex-col items-start gap-2'>
              <span className='text-gray-600 text-md'>Caption</span>
              <Field
                name="caption"
                type="text"
                className='w-full px-3 py-2 focus:outline-none border border-indigo-400 bg-indigo-50 rounded-md'
              />
              <ErrorMessage name="caption" component="div" className='text-red-500 text-sm' />
            </div>

            {/* Hashtags */}
            <div className='flex flex-col items-start gap-2'>
              <span className='text-gray-600 text-md'># Hashtags</span>
              <MultiSelectDropdown
                selected={values.hashtags}
                onChange={(selected) => setFieldValue("hashtags", selected)}
              />
              {submitCount > 0 && errors.hashtags && (
                <div className='text-red-500 text-sm'>{errors.hashtags}</div>
              )}
            </div>

            {uploading && (
              <div className='w-full flex flex-col items-center gap-2 mb-5'>
                <h1>Posting...</h1>
                <div className="w-full bg-indigo-100 rounded-full h-2 overflow-hidden">

                  <div
                    className="bg-indigo-600 h-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

            )}
            {failure && <p className='w-full text-center text-red-500 font-medium text-md'>An error occured, Try again!</p>}
            {/* Submit Button */}
            <button
              type="submit"
              className='w-full bg-indigo-500 text-white py-2 rounded-lg hover:bg-indigo-600 transition my-5 disabled:opacity-60'
              disabled={uploading}
            >
              {uploading ? "Uploading..." : "Post"}
            </button>


          </Form>
        )}
      </Formik>
    </div>
  );
};

export default CreatePost;
