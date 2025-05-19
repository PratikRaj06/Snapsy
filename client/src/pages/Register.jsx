import React, { useState, useEffect } from 'react';
import { useFormik } from 'formik';
import { Link } from 'react-router-dom';
import axios from "axios";
import { useAuth } from '../contexts/AuthContext';
const Register = () => {
  const { setUser } = useAuth();
  const images = ['/img1.svg', '/img2.svg', '/img3.svg'];
  const texts = ['Connect with the World', 'Share Your Moments', 'Build Your Community'];
  const [index, setIndex] = useState(0);
  const [agreeTnC, setAgreeTnC] = useState(false);
  const [success, setSuccess] = useState(false)
  const [failure, setFailure] = useState(false)
  
  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const formik = useFormik({
    initialValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
    validate: (values) => {
      let errors = {};

      if (!values.username) {
        errors.username = "Username is required";
      } else if (values.username.length < 3) {
        errors.username = "Minimum 3 characters";
      } else if (values.username.length > 15) {
        errors.username = "Maximum 15 characters";
      }

      if (!values.email) {
        errors.email = "Email is required";
      } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(values.email)) {
        errors.email = "Invalid email format";
      }

      if (!values.password) {
        errors.password = "Password is required";
      } else if (values.password.length < 6) {
        errors.password = "Password must be at least 6 characters";
      }

      if (!values.confirmPassword) {
        errors.confirmPassword = "Please confirm your password";
      } else if (values.password !== values.confirmPassword) {
        errors.confirmPassword = "Passwords do not match";
      }

      return errors;
    },
    onSubmit: async (values, { setErrors, setSubmitting }) => {
      setFailure(false);
      try {
        const res = await axios.post(`${import.meta.env.VITE_SERVER_URL}/auth/register`, {
          username: values.username,
          email: values.email,
          password: values.password,
        });

        const user = {
          id: res.data.user.id,
          username: res.data.user.username,
          token: res.data.token,
          createdAt: Date.now()
        }
        setUser(user)
        localStorage.setItem("user", JSON.stringify(user));
        window.scrollTo(0,0)
        setSuccess(true); // show congratulation screen
      } catch (err) {
        if (err.response?.data?.error) {
          const errorMsg = err.response.data.error.toLowerCase();
          // map backend error to fields
          if (errorMsg.includes("username")) {
            setErrors({ username: errorMsg });
          } else if (errorMsg.includes("email")) {
            setErrors({ email: errorMsg });
          } else {
            setFailure(true);
            console.log(errorMsg);
          }
        }
      } finally {
        setSubmitting(false);
      }
    }
  });

  return (
    <>
      {success && (
        <div className="absolute w-full min-h-screen backdrop-blur-sm bg-black/10 flex items-center justify-center">
          <div className="xl:w-1/4 lg:w-1/3 md:w-8/12 w-11/12 flex flex-col items-center p-10 gap-5 bg-white rounded-xl shadow-lg">
            <h1 className="text-2xl font-semibold text-indigo-600 text-center">🎉 Congratulations!</h1>
            <img src="/welcome.svg" className="w-full" alt="Welcome Illustration" />
            <p className="text-md font-normal text-gray-600 text-center">
              Your account has been successfully created. You're all set to explore!
            </p>
            <Link
              to="/"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-center px-5 py-2 rounded-lg transition duration-200"
            >
              Explore Now
            </Link>
          </div>
        </div>
      )}


      <div className='w-full min-h-screen flex lg:flex-row flex-col-reverse items-center justify-center gap-10 py-10'>
        {/* Left Section (Image & Text) */}
        <div className='xl:w-1/2 lg:w-1/2 md:w-10/12 w-10/12 flex flex-col items-center justify-center'>
          <img src="/logoName.png" className='h-16 xl:inline-block lg:inline-block hidden' alt="Logo" />
          <img src={images[index]} alt="Illustration" className='w-full max-h-[60vh] h-full' />
          <h1 className='text-2xl font-semibold text-indigo-600'>
            {texts[index]}
          </h1>
        </div>

        {/* Right Section (Registration Form) */}
        <div className='xl:w-1/3 lg:w-1/3 md:w-10/12 w-11/12 flex flex-col items-center'>
          <img src="/logoName.png" className='h-16 xl:hidden lg:hidden mb-2' alt="Logo" />
          <form onSubmit={formik.handleSubmit} className="w-full py-10 xl:px-10 lg:px-10 md:px-10 px-5 shadow-lg rounded-lg bg-white gap-6 flex flex-col items-center border">
            <h2 className="text-3xl font-bold text-indigo-700 text-center">Create Your Account</h2>


            {/* Username */}
            <div className="w-full flex flex-col">
              <label className="text-gray-700 font-medium mb-1">Username</label>
              <input
                type="text"
                name="username"
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                value={formik.values.username}
                className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                placeholder="Enter username"
              />
              {formik.touched.username && formik.errors.username && (
                <p className="text-red-500 text-sm mt-1">{formik.errors.username}</p>
              )}
            </div>

            {/* Email */}
            <div className="w-full flex flex-col">
              <label className="text-gray-700 font-medium mb-1">Email</label>
              <input
                type="email"
                name="email"
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                value={formik.values.email}
                className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                placeholder="Enter email"
              />
              {formik.touched.email && formik.errors.email && (
                <p className="text-red-500 text-sm mt-1">{formik.errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div className="w-full flex flex-col">
              <label className="text-gray-700 font-medium mb-1">Password</label>
              <input
                type="password"
                name="password"
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                value={formik.values.password}
                className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                placeholder="Enter password"
              />
              {formik.touched.password && formik.errors.password && (
                <p className="text-red-500 text-sm mt-1">{formik.errors.password}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div className="w-full flex flex-col">
              <label className="text-gray-700 font-medium mb-1">Confirm Password</label>
              <input
                type="password"
                name="confirmPassword"
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                value={formik.values.confirmPassword}
                className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                placeholder="Confirm password"
              />
              {formik.touched.confirmPassword && formik.errors.confirmPassword && (
                <p className="text-red-500 text-sm mt-1">{formik.errors.confirmPassword}</p>
              )}
            </div>

            {/* Terms and Conditions Checkbox */}
            <div className="w-full flex items-center gap-2">
              <input
                type="checkbox"
                id="agreeTnC"
                checked={agreeTnC}
                onChange={() => setAgreeTnC(!agreeTnC)}
                className="h-4 w-4 accent-indigo-600 border-gray-300 rounded focus:ring-indigo-500 cursor-pointer"
              />
              <label htmlFor="agreeTnC" className="text-gray-700 cursor-pointer">
                I agree to the <span className="text-indigo-600 underline">Terms & Conditions</span>
              </label>
            </div>
            {failure && <p className='text-red-500 font-medium text-md'>An error occured, Try again!</p>}
            {/* Submit Button (Disabled if T&C not agreed) */}
            <button
              type="submit"
              disabled={!agreeTnC || formik.isSubmitting}
              className={`w-full font-semibold py-3 rounded-lg transition duration-200 ${agreeTnC
                  ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                  : "bg-indigo-300 cursor-not-allowed text-gray-700"
                } flex items-center justify-center`}
            >
              {formik.isSubmitting ? <div className='w-4 h-4 border-t-2 rounded-full animate-spin border-white'></div> : <span>Sign Up</span>}
            </button>

            {/* Redirect to Login */}
            <p className="text-gray-600">
              Already have an account? <Link to="/login" className="text-indigo-600 font-medium">Sign In</Link>
            </p>
          </form>
        </div>
      </div>
    </>
  );
};

export default Register;
