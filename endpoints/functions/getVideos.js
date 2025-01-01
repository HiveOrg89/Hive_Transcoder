require("dotenv").config();
const supabaseServices = require("../SDKs/supabase");

const getVideosInQueue = async () => {
  const { supabase } = await supabaseServices();

  // Retrieve videos in the queue
  const { data: videos, error } = await supabase
    .from("video-queue")
    .select("*")
    .eq("state", "unprocessed")
    .is("instance_id", null)
    .order("time_added", { ascending: true })
    .limit(5);

  if (error) {
    console.error("Error retrieving videos:", error);
    return null;
  }

  return videos;
};

module.exports = getVideosInQueue;
