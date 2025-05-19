import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "./AuthContext";

const ExploreContext = createContext({
    explorePosts: [],
    loading: false,
    refreshExplore: () => {},
  });
  

export const useExplore = () => useContext(ExploreContext);

export const ExploreProvider = ({ children }) => {
    const [explorePosts, setExplorePosts] = useState([]);
    const [loading, setLoading] = useState(false);
    const { user } = useAuth();

    const fetchExplorePosts = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const res = await axios.get(`${import.meta.env.VITE_SERVER_URL}/public/explore`, {
                headers: {
                    Authorization: `Bearer ${user.token}`,
                },
            });
            setExplorePosts(res.data);
        } catch (err) {
            console.error("Explore fetch error:", err.message);
            setExplorePosts([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchExplorePosts();
    }, [user]);

    return (
        <ExploreContext.Provider value={{ explorePosts, loading, refreshExplore: fetchExplorePosts }}>
            {children}
        </ExploreContext.Provider>
    );
};
