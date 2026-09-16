import mongoose from "mongoose";

const MONGODB_URL = "mongodb://localhost:27017";
const DB_NAME = "youtube_backend";

// The two valid user IDs that exist
const validOwnerIds = [
  new mongoose.Types.ObjectId("6a86f3fef09b5a8ac193bb81"),
  new mongoose.Types.ObjectId("6a8bddae726cc3aeb037305f"),
];

async function run() {
  await mongoose.connect(`${MONGODB_URL}/${DB_NAME}`);
  console.log("Connected to MongoDB");

  const db = mongoose.connection.db;
  const videosCollection = db.collection("videos");

  // First, preview what will be deleted
  const orphanedVideos = await videosCollection
    .find({ owner: { $nin: validOwnerIds } })
    .toArray();

  console.log(`\nFound ${orphanedVideos.length} video(s) with non-existent owners:\n`);
  orphanedVideos.forEach((v) => {
    console.log(
      `  - _id: ${v._id} | title: "${v.title}" | owner: ${v.owner} | duration: ${v.duration}`
    );
  });

  if (orphanedVideos.length === 0) {
    console.log("\nNothing to delete. All videos belong to valid users.");
    await mongoose.disconnect();
    process.exit(0);
  }

  // Delete orphaned videos
  const result = await videosCollection.deleteMany({
    owner: { $nin: validOwnerIds },
  });

  console.log(`\n✅ Deleted ${result.deletedCount} orphaned video(s).`);

  // Also clean up any likes and comments that reference deleted videos
  const deletedVideoIds = orphanedVideos.map((v) => v._id);

  const likesCollection = db.collection("likes");
  const commentsCollection = db.collection("comments");

  const likesExist = await likesCollection.countDocuments({}).catch(() => 0);
  if (likesExist > 0) {
    const likesResult = await likesCollection.deleteMany({
      video: { $in: deletedVideoIds },
    });
    console.log(`   Cleaned up ${likesResult.deletedCount} orphaned like(s).`);
  }

  const commentsExist = await commentsCollection.countDocuments({}).catch(() => 0);
  if (commentsExist > 0) {
    const commentsResult = await commentsCollection.deleteMany({
      video: { $in: deletedVideoIds },
    });
    console.log(`   Cleaned up ${commentsResult.deletedCount} orphaned comment(s).`);
  }

  console.log("\nDone! Database cleaned.");
  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
