import React, { useState, useRef, useEffect } from "react";
import { FaChevronDown, FaChevronUp } from "react-icons/fa6";
import { IoClose } from "react-icons/io5";

const MultiSelectDropdown = ({ options, onChange, selected = [] }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedValues, setSelectedValues] = useState(selected);
    const dropdownRef = useRef(null);
    const hashtags = [
        "art",
        "beauty",
        "books",
        "business",
        "coding",
        "cricket",
        "education",
        "entrepreneur",
        "fashion",
        "fitness",
        "food",
        "funny",
        "gaming",
        "motivation",
        "music",
        "nature",
        "pets",
        "photography",
        "selfcare",
        "technology",
        "travel"
    ];

    useEffect(() => {
        setSelectedValues(selected);
    }, [selected]);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSelect = (tag) => {
        if (!selectedValues.includes(tag)) {
            const newSelected = [...selectedValues, tag];
            setSelectedValues(newSelected);
            onChange?.(newSelected); // optional
        }
        setSearchTerm("");
    };

    const handleRemove = (value) => {
        const newSelected = selectedValues.filter((v) => v !== value);
        setSelectedValues(newSelected);
        onChange(newSelected);
    };

    const filteredOptions = hashtags.filter(
        (tag) =>
            tag.toLowerCase().includes(searchTerm.toLowerCase()) &&
            !selectedValues.includes(tag)
    );


    return (
        <div className="relative w-full" ref={dropdownRef}>
            {/* Selected Tags */}
            <div
                className="flex flex-wrap gap-2 items-center border border-indigo-400 rounded-lg py-1 px-3 bg-hippie-green-50 cursor-text bg-indigo-50"
                onClick={() => setIsOpen(true)}
            >
                {selectedValues.map((tag, index) => (
                    <div
                        key={index}
                        className="flex items-center bg-hippie-green-100 text-hippie-green-800 rounded-full text-sm bg-indigo-500 px-2 py-1 text-indigo-50"
                    >
                        #{tag}
                        <button
                            className="ml-2 focus:outline-none text-red-300 text-xl backdrop-blur-sm"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleRemove(tag);
                            }}
                        >
                            <IoClose className="" />
                        </button>
                    </div>
                ))}
                <input
                    type="text"
                    className="flex-1 min-w-[120px] p-1 outline-none bg-transparent"
                    placeholder="Search hashtags..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onFocus={() => setIsOpen(true)}
                />
                <button
                    className="ml-2 text-hippie-green-800 text-indigo-600"
                    onClick={() => setIsOpen(!isOpen)}
                >
                    {isOpen ? <FaChevronUp /> : <FaChevronDown />}
                </button>
            </div>

            {/* Dropdown List */}
            {isOpen && (
                <ul className="absolute w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
                    {filteredOptions.length > 0 ? (
                        filteredOptions.map((option, index) => {
                            const name = option;
                            return (
                                <li
                                    key={index}
                                    className="p-2 hover:bg-gray-100 cursor-pointer text-indigo-700"
                                    onClick={() => handleSelect(option)}
                                >
                                    #{name}
                                </li>
                            );
                        })
                    ) : (
                        <li className="p-2 text-gray-500">No results found</li>
                    )}
                </ul>
            )}
        </div>
    );
};

export default MultiSelectDropdown;
