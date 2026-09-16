import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import VideoCard from "../components/VideoCard";
import { userService } from "../services/user.service";

export default function Saved() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSaved = async () => {
      try {
        const response = await userService.savedVideos();
        setItems(Array.isArray(response?.data) ? response.data : []);
      } catch (error) {
        console.error("Failed to fetch saved videos:", error);
        setItems([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSaved();
  }, []);

  return (
    <Layout>
      <p className="text-sm font-bold uppercase tracking-widest text-brand">
        Library
      </p>

      <h1 className="mt-2 text-3xl font-extrabold">Saved videos</h1>

      <p className="mt-2 text-sm text-slate-400">
        Reels and videos you bookmarked for later.
      </p>

      {loading ? (
        <p className="mt-12 text-center text-sm text-slate-500">
          Loading saved videos...
        </p>
      ) : items.length > 0 ? (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((video) => (
            <VideoCard key={video._id} video={video} />
          ))}
        </div>
      ) : (
        <p className="mt-12 text-center text-sm text-slate-500">
          No saved videos yet.
        </p>
      )}
    </Layout>
  );
}
