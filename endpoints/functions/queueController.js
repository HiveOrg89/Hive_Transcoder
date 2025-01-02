const { setUpTranscodingJobs } = require("../transcoder");
const { retrieveInstanceId, getEnvironment } = require("./getInstanceId");
const getVideosInQueue = require("./getVideos");
const removeVideosFromQueue = require("./removeVideos");
const supabaseServices = require("../SDKs/supabase");
const checkMaintananceStatus = require("./checkMaintenance");
require("dotenv").config();
const environment = getEnvironment();

let internalQueue = [];
let currentJobs = [];
const MAXIMUM_CONCURRENT_JOBS = 5;

const updateInternalQueue = (video) => {
  console.log(video);
  if (video.instance_id !== null) return;
  // check if this video belongs to this instance before adding it to queue
  internalQueue = [...internalQueue, video];
  if (currentJobs.length < 5) {
    addJob(video);
  }
};

const getCurrentJobs = () => {
  return currentJobs;
};

const startJobs = async () => {
  if (environment === "dev") {
    currentJobs.push(...internalQueue);
    setUpTranscodingJobs(internalQueue);
    console.log(internalQueue, "setting up jobs");
    return;
  }
  const data = await getVideosInQueue();

  internalQueue = [...data];
  const firstFiveVideos = internalQueue.slice(0, MAXIMUM_CONCURRENT_JOBS);
  //   internalQueue = internalQueue.filter((video) => !currentJobs.some((currentJob) => currentJob.video_id === video.video_id));

  for (const video of firstFiveVideos) {
    addJob(video);
  }
  if (firstFiveVideos.length === 0) {
    setUpTranscodingJobs([]);
  }

  // get first five and set up transcoding tasks
};

async function addJob(videoToAdd) {
  // Find a video in the queue that is not currently being transcoded

  if (videoToAdd) {
    const { supabase } = await supabaseServices();
    const instanceId = retrieveInstanceId();
    try {
      const maintenanceData = await checkMaintananceStatus();

      if (maintenanceData?.under_maintenance === true) {
        console.log("Instance is under maintenance, skipping job");
        removeJob(videoToAdd);
        return;
      } else if (!maintenanceData) {
        console.log("Check failed, removing job to prevent issues");
        removeJob(videoToAdd);
        return;
      }

      // Update the state of the video to "processing"
      const { error: updateError } = await supabase
        .from("video-queue")
        .update({ state: "processing", instance_id: instanceId })
        .eq("video_id", videoToAdd.video_id)
        .is("instance_id", null);

      if (updateError) {
        console.error("Error updating video state: ", updateError);
        removeJob(videoToAdd);
        return;
      } else {
        // Add the new video to currentJobs
        currentJobs.push(videoToAdd);

        // Set up a transcoding task for the video
        setUpTranscodingJobs([videoToAdd]);
      }
    } catch (err) {
      console.error("Error adding job: ", err);
    }
  } else {
    setUpTranscodingJobs([]);
  }
}

async function removeJob(videoToRemove) {
  // remove a task from the queue and add another one
  internalQueue = internalQueue.filter(
    (task) => task.video_id === videoToRemove.video_id
  );
  const videoToAdd = internalQueue.find(
    (video) =>
      !currentJobs.some((currentJob) => currentJob.video_id === video.video_id)
  );

  // remove done video from currentJobs
  currentJobs = currentJobs.filter(
    (video) => video.video_id !== videoToRemove.video_id
  );
  await removeVideosFromQueue([videoToRemove]);

  addJob(videoToAdd);
}

module.exports = {
  updateInternalQueue,
  getCurrentJobs,
  startJobs,
  removeJob,
};
