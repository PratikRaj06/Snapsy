import React, { useState } from 'react'
import { IoIosArrowDropleft, IoIosArrowDropright } from "react-icons/io";

const ImageSlider = ({ images }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const len = images.length;

    return (
        <div className="w-full relative flex flex-col items-center">
            {/* Image with Instagram-like ratio */}
            <div className="w-full aspect-square overflow-hidden">
                <img
                    src={images[currentIndex]}
                    alt=""
                    className="w-full h-full object-cover rounded-md"
                />
            </div>

            {/* Bottom buttons */}
            <div className="w-full flex justify-between px-4 py-2 absolute bottom-2 left-0">
                {/* Left Button */}
                <button type='button'
                    onClick={() => setCurrentIndex(currentIndex - 1)}
                    className={`text-3xl drop-shadow-lg transition-opacity duration-200 ${currentIndex === 0 ? 'opacity-0 pointer-events-none' : 'opacity-100'} text-gray-100 bg-black/50 rounded-full`}
                >
                    <IoIosArrowDropleft />
                </button>

                {/* Right Button */}
                <button type='button'
                    onClick={() => setCurrentIndex(currentIndex + 1)}
                    className={`text-3xl drop-shadow-lg transition-opacity duration-200 ${currentIndex === len - 1 ? 'opacity-0 pointer-events-none' : 'opacity-100'} text-gray-100 bg-black/50 rounded-full`}
                >
                    <IoIosArrowDropright />
                </button>
            </div>
        </div>
    );
};

export default ImageSlider;
