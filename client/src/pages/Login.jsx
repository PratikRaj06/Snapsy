import React, { useState, useEffect } from 'react';
import { useFormik } from 'formik';
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { Link } from 'react-router-dom';
import axios from "axios";
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from "react-router-dom";


const Login = () => {
  const images = ['/img1.svg', '/img2.svg', '/img3.svg'];
  const texts = ['Connect with the World', 'Share Your Moments', 'Build Your Community'];
  const { setUser } = useAuth();
  const navigate = useNavigate();

  const [index, setIndex] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [failure, setFailure] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Load saved credentials if they exist
  useEffect(() => {
    const savedIdentifier = localStorage.getItem('identifier');
    const savedPassword = localStorage.getItem('password');
    const savedRememberMe = localStorage.getItem('rememberMe') === 'true';

    if (savedIdentifier && savedPassword && savedRememberMe) {
      formik.setValues({
        identifier: savedIdentifier,
        password: savedPassword,
      });
      setRememberMe(true);
    }
  }, []);

  const formik = useFormik({
    initialValues: {
      identifier: "",
      password: ""
    },
    validate: (values) => {
      let errors = {};

      if (!values.identifier) {
        errors.identifier = "Username or Email is required";
      } else if (values.identifier.length < 3) {
        errors.identifier = "Minimum 3 characters";
      }

      if (!values.password) {
        errors.password = "Password is required";
      } else if (values.password.length < 6) {
        errors.password = "Password must be at least 6 characters";
      }

      return errors;
    },
    onSubmit: async (values, { setSubmitting, setErrors }) => {

      setFailure(false);

      try {
        const res = await axios.post(`${import.meta.env.VITE_SERVER_URL}/auth/login`, {
          identifier: values.identifier,
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
        navigate("/");
      } catch (err) {
        if (err.response?.data?.error) {
          const errorMsg = err.response.data.error.toLowerCase();
          // map backend error to fields
          if (errorMsg.includes("user")) {
            setErrors({ identifier: err.response.data.error });
          } else if (errorMsg.includes("password")) {
            setErrors({ password: err.response.data.error });
          } else {
            setFailure(true);
            console.log(errorMsg);
          }
        }
      } finally {
        setSubmitting(false);
      }

      if (rememberMe) {
        localStorage.setItem('identifier', values.identifier);
        localStorage.setItem('password', values.password);
        localStorage.setItem('rememberMe', 'true');
      } else {
        localStorage.removeItem('identifier');
        localStorage.removeItem('password');
        localStorage.removeItem('rememberMe');
      }
    }
  });

  return (
    <div className='w-full min-h-screen flex lg:flex-row flex-col-reverse  items-center justify-center gap-10 py-10'>
      {/* Left Section (Image & Text) */}
      <div className='xl:w-1/3 lg:w-1/3 md:w-10/12 w-10/12 flex flex-col items-center justify-center'>
        <img src="/logoName.png" className='h-16 xl:inline-block lg:inline-block hidden' alt="Logo" />
        <img src={images[index]} alt="Illustration" className='w-full' />
        <h1 className='text-2xl font-semibold text-indigo-600'>
          {texts[index]}
        </h1>
      </div>

      {/* Right Section (Login Form) */}
      <div className='xl:w-1/3 lg:w-1/3 md:w-10/12 w-11/12 flex flex-col items-center'>
        <img src="/logoName.png" className='h-16 xl:hidden lg:hidden mb-2' alt="Logo" />
        <form onSubmit={formik.handleSubmit} className="w-full py-10 xl:px-10 lg:px-10 md:px-10 px-5 shadow-lg rounded-lg bg-white gap-8 flex flex-col items-center border">

          <h2 className="text-3xl font-bold text-indigo-700 text-center">Welcome back!</h2>

          {/* Identifier (Email/Username) */}
          <div className="w-full flex flex-col items-start gap-2">
            <label className="block text-gray-700 font-medium">
              Username or Email
            </label>
            <input
              type="text"
              name="identifier"
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              value={formik.values.identifier}
              className="w-full border p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Enter username or email"
            />
            {formik.touched.identifier && formik.errors.identifier && (
              <p className="text-red-500 text-sm">{formik.errors.identifier}</p>
            )}
          </div>

          {/* Password */}
          <div className="w-full flex flex-col items-start gap-2">
            <label className="block text-gray-700 font-medium">Password</label>

            {/* Wrapper with focus-within for ring effect */}
            <div className='w-full border p-3 rounded-lg flex items-center justify-between gap-2 focus-within:ring-2 focus-within:ring-indigo-500'>
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                value={formik.values.password}
                className="w-full focus:outline-none"
                placeholder="Enter password"
              />
              <button
                type='button'
                className='text-xl text-indigo-600'
                onClick={() => setShowPassword(!showPassword)}
              >
                {!showPassword ? <FaEye /> : <FaEyeSlash />}
              </button>
            </div>

            {/* Error Message */}
            {formik.touched.password && formik.errors.password && (
              <p className="text-red-500 text-sm">{formik.errors.password}</p>
            )}
          </div>

          {/* Remember Me Checkbox */}
          <div className="w-full flex items-center gap-2">
            <input
              type="checkbox"
              id="rememberMe"
              checked={rememberMe}
              onChange={() => setRememberMe(!rememberMe)}
              className="h-4 w-4 accent-indigo-600 border-gray-300 rounded focus:ring-indigo-500 cursor-pointer"
            />
            <label htmlFor="rememberMe" className="text-gray-700 cursor-pointer">
              Remember Me
            </label>
          </div>

          {failure && <p className='w-full text-center text-red-500 font-medium text-md'>An error occured, Try again!</p>}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={formik.isSubmitting}
            className={`w-full font-semibold py-3 rounded-lg transition duration-200 ${formik.isSubmitting
              ? "bg-indigo-300 cursor-not-allowed"
              : "bg-indigo-600 hover:bg-indigo-700 text-white"
              } flex items-center justify-center`}
          >
            {formik.isSubmitting ? <div className='w-4 h-4 border-t-2 rounded-full animate-spin border-white'></div> : <span>Sign In</span>}
          </button>

          <Link to={'/register'} className='text-md font-normal text-indigo-600 border-b-2 border-indigo-600 border-opacity-0 hover:border-opacity-100 transition'>Create New Account</Link>
        </form>

      </div>
    </div>
  );
};

export default Login;
