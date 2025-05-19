import React, { useState, useEffect } from 'react';
import { TbUserSearch } from "react-icons/tb";
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { debounce } from 'lodash';
import { IoHeartOutline } from "react-icons/io5";
import { TbRefresh } from "react-icons/tb";
import { useExplore } from '../contexts/ExploreContext';

const SearchUser = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const fetchUsers = async (searchTerm) => {
    if (!searchTerm.trim()) return setResults([]);

    try {
      const res = await axios.get(`${import.meta.env.VITE_SERVER_URL}/public/search`, {
        params: { username: searchTerm },
        headers: {
          Authorization: `Bearer ${user.token}`
        }
      });
      setResults(res.data);
      setShowDropdown(true);
    } catch (error) {
      console.log('Search error:', error.message);
    }
  };

  // Debounced version to prevent too many API calls
  const debouncedSearch = debounce((value) => {
    fetchUsers(value);
  }, 300);

  useEffect(() => {
    if (query.trim()) {
      debouncedSearch(query);
    } else {
      setResults([]);
      setShowDropdown(false);
    }
  }, [query]);

  const handleSelect = (userId) => {
    navigate(`/user/${userId}`);
    setQuery('');
    setTimeout(() => {
      setShowDropdown(false);
    }, 2000);
  };

  return (
    <div className="relative w-full mx-auto">
      <div className='w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-50 border border-indigo-500 px-5 py-2'>
        <TbUserSearch className='text-indigo-600 text-2xl' />
        <input type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length && setShowDropdown(true)}
          onBlur={() => setTimeout(() => setShowDropdown(false), 150)} className='w-full focus:outline-none px-2 bg-transparent ' placeholder='Search by username' />
      </div>
      {showDropdown && Array.isArray(results) ? (
        results.length > 0 ? (
          <ul className="absolute z-10 w-full bg-white border rounded-lg mt-1 shadow-md max-h-64 overflow-y-auto p-2">
            {results.map((u) => (
              <li
                key={u._id}
                onMouseDown={() => handleSelect(u._id)}
                className="flex items-center gap-3 p-2 hover:bg-gray-100 cursor-pointer rounded-md"
              >
                <img src={u.avatar} alt="avatar" className="w-8 h-8 rounded-full object-cover" />
                <span className='text-indigo-800'>{u.username}</span>
              </li>
            ))}
          </ul>
        ) : (
          query.trim() && (
            <div className='absolute z-10 w-full bg-white border rounded-lg mt-1 shadow-md py-2 px-5 italic font-extralight text-md'>
              No results
            </div>
          )
        )
      ) : null}

    </div>
  );
};

const Explore = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState(null)

  const { explorePosts, refreshExplore, loading } = useExplore();


  return (
    <div className='w-full flex flex-col items-center gap-5 bg-white border rounded-lg p-5'>

      <SearchUser />
      <div className='w-full flex flex-col items-center gap-5 bg-white border rounded-lg p-5'>
        <div className="w-full flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-700">Trending</h2>
          <button onClick={refreshExplore} title="Refresh">
            <TbRefresh className="text-gray-700 text-2xl active:animate-spin" />
          </button>
        </div>

        {loading ? (
          <p className='text-gray-600 italic'>Loading...</p>
        ) : Array.isArray(explorePosts) && explorePosts.length === 0 ? (
          <p className='text-gray-600 italic'>Nothing to explore now! Try again</p>
        ) : (
          <div className='w-full grid grid-cols-2 gap-1 pb-5'>
            {explorePosts.map((item) => (
              <Link
                to={`/show-post/${item._id}`}
                key={item._id}
                className='w-full flex flex-col items-start relative group'
              >
                <div className='w-full aspect-square overflow-hidden rounded'>
                  <img
                    src={item.images[0]}
                    alt=""
                    className='w-full h-full object-cover transform transition-transform duration-300 ease-in-out group-hover:scale-110'
                  />
                </div>
                <span className='flex items-center justify-start gap-1 absolute bottom-0 text-white py-1 px-2 bg-black/20 backdrop-blur-sm rounded-lg text-sm'>
                  <IoHeartOutline /> <span>{item.likeCount}</span>
                </span>
              </Link>
            ))}
          </div>

        )}
      </div>


    </div>
  )
}

export default Explore