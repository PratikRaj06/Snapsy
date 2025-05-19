import React, { useState } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { FaCompass } from "react-icons/fa6";
import { IoNotifications } from "react-icons/io5";
import { HiMiniHome } from "react-icons/hi2";
import { IoMdClose, IoMdMenu } from "react-icons/io";
import { TbMessageChatbotFilled } from "react-icons/tb";
import { FaUser } from "react-icons/fa";
import { IoMdAddCircle } from "react-icons/io";

import { useAuth } from "../contexts/AuthContext";

const Layout = () => {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const { expired } = useAuth();

    return (
        <>
            {expired && (
                <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded shadow-lg z-50">
                    Your session has expired. Please log in again.
                </div>
            )}

            <div className="w-full min-h-screen flex flex-col items-center bg-gray-100">
                {/* Main content */}
                <div className={`w-full h-full flex flex-col items-center`}>
                    {/* Always visible top header */}
                    <header className="w-full flex items-center justify-between py-3 px-5 fixed top-0 z-20 bg-white border-b shadow-sm">
                        <img src="/logoName.png" className="h-8" alt="Logo" />
                    </header>

                    <div className='w-full h-full flex items-start'>
                        <div className={`w-auto hidden lg:flex h-full flex-col items-center gap-8 bg-white shadow-lg p-2 transition-all duration-300 fixed left-0 my-16`}>
                            {/* Sidebar Header with toggle and logo */}

                            <button className='w-full flex items-center p-2 text-indigo-600' onClick={() => setSidebarOpen(!sidebarOpen)}>
                                {sidebarOpen ? <IoMdClose className='text-3xl' /> : <IoMdMenu className='text-3xl' />}
                            </button>


                            <SidebarNavItem to="/" icon={<HiMiniHome className="text-3xl" />} label="Home" open={sidebarOpen} />
                            <SidebarNavItem to="/explore" icon={<FaCompass className="text-3xl" />} label="Explore" open={sidebarOpen} />
                            <SidebarNavItem to="/create-post" icon={<IoMdAddCircle className="text-3xl" />} label="Post" open={sidebarOpen} />
                            <SidebarNavItem to="/notifications" icon={<IoNotifications className="text-3xl" />} label="Notifications" open={sidebarOpen} />
                            <SidebarNavItem to="/profile" icon={<FaUser className="text-3xl" />} label="Profile" open={sidebarOpen} />
                        </div>

                        {/* Content area */}
                        <div className="w-full h-full flex flex-col items-center my-16 overflow-y-auto">
                            <div className='w-full h-full lg:w-1/2 xl:w-[40%]'>
                                <Outlet />
                            </div>
                        </div>
                    </div>

                    {/* Bottom nav for smaller screens */}
                    <div className="lg:hidden w-full fixed bottom-0 flex items-center justify-evenly py-2 bg-white border-t drop-shadow-md">
                        <NavItem icon={<HiMiniHome className="text-3xl" />} to="/" />
                        <NavItem icon={<FaCompass className="text-3xl" />} to="/explore" />
                        <NavItem icon={<TbMessageChatbotFilled className="text-3xl" />} to="/add-post" />
                        <NavItem icon={<IoNotifications className="text-3xl" />} to="/notifications" />
                        <NavItem icon={<FaUser className="text-3xl" />} to="/profile" />
                    </div>
                </div>
            </div>

        </>
    );
};

const NavItem = ({ icon, to }) => (
    <Link
        to={to}
        className="flex items-center justify-center text-indigo-600 p-2 hover:bg-indigo-100 active:bg-indigo-300 rounded-lg"
    >
        {icon}
    </Link>
);

const SidebarNavItem = ({ icon, label, to, open }) => (
    <Link
        to={to}
        className="w-full flex items-center gap-3 text-indigo-600 hover:bg-indigo-100 active:bg-indigo-300 rounded-lg py-2 px-3"
    >
        {icon}
        {open && <span className="text-md font-medium">{label}</span>}
    </Link>
);

export default Layout;
