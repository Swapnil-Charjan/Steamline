import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import VideoCard from "../components/VideoCard";
import { userService } from "../services/user.service";

export default function History() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await userService.history();

        setItems(Array.isArray(response?.data) ? response.data : []);
      } catch (error) {
        console.error("Failed to fetch watch history:", error);
        setItems([]);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  return (
    <Layout>
      <p className="text-sm font-bold uppercase tracking-widest text-brand">
        Library
      </p>

      <h1 className="mt-2 text-3xl font-extrabold">Watch history</h1>

      <p className="mt-2 text-sm text-slate-400">
        The videos you recently opened.
      </p>

      {loading ? (
        <p className="mt-12 text-center text-sm text-slate-500">
          Loading watch history...
        </p>
      ) : items.length > 0 ? (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((video) => (
            <VideoCard key={video._id} video={video} />
          ))}
        </div>
      ) : (
        <p className="mt-12 text-center text-sm text-slate-500">
          No watched videos yet.
        </p>
      )}
    </Layout>
  );
}
