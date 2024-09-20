import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/videoModel.js";
import { User } from "../models/userModel.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/fileUpload.js";

const getAllVideos = asyncHandler(async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      query = "",
      sortBy = ["relevance", "uploadDate", "viewCount"],
      sortType = ["video", "playlist", "channel"],
      userId,
    } = req.query;

    const pageNumber = Math.max(1, Number(page));
    const limitNumber = Math.max(1, Number(limit));

    const filter = {};

    if (query) {
      filter.title = { $regex: query, $options: "i" };
    }
    if (userId && isValidObjectId(userId)) {
      filter.userId = userId;
    }

    const sortOptions = {};

    switch (sortBy) {
      case "relevance":
        sortOptions.title = 1;
        break;
      case "uploadDate":
        sortOptions.createdAt = -1;
      case "viewCount":
        sortOptions.viewCount = -1;
      default:
        sortOptions.title = 1;
    }

    switch (sortType) {
      case "video":
        filter.type = "video";
        break;
      case "playlist":
        filter.type = "playlist";
      case "channel":
        filter.type = "channel";
      default:
        break;
    }

    const totalVideos = await Video.countDocuments(filter);

    const skip = (pageNumber - 1) * limitNumber;

    const videos = await Video.find(filter)
      .skip(skip)
      .limit(limitNumber)
      .sort(sortOptions);

    if (!videos || videos.length === 0) {
      return res
        .status(200)
        .json(new ApiResponse(200, [], "No videos to display"));
    }

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          videos,
          totalVideos,
          pageNumber,
          limitNumber,
          "Videos fetched successfully"
        )
      );
  } catch (error) {
    // Handle any unexpected errors
    throw new ApiError(500, "Something went wrong, please try again later.");
  }
});

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;

  if ([title, description].some((field) => field?.trim() === "")) {
    throw new ApiError(400, "title and description are required");
  }

  const owner = await User.findById(req.user._id);
  if (!owner) {
    throw new ApiError(404, "User not found");
  }

  // Check if files are uploaded
  const videoFileArray = req.files?.videoFile || [];
  const thumbnailFileArray = req.files?.thumbnail || [];

  if (videoFileArray.length === 0 || thumbnailFileArray.length === 0) {
    throw new ApiError(400, "Video and thumbnail files must be uploaded");
  }

  const videoLocalPath = req.files?.videoFile[0]?.path;
  const thumbnailLocalPath = req.files?.thumbnail[0]?.path;

  if (!videoLocalPath || !thumbnailLocalPath) {
    throw new ApiError(400, "Video and thumbnail must be present to upload");
  }

  const videoFile = await uploadOnCloudinary(videoLocalPath);

  const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

  if (!videoFile || !thumbnail) {
    throw new ApiError(500, "Failed to upload files to Cloudinary");
  }

  // taking res from cloudinary
  const { duration } = videoFile;

  const video = await Video.create({
    videoFile: videoFile.url,
    thumbnail: thumbnail.url,
    title,
    description,
    duration: duration || 0,
    views: 0,
    isPublished: true,
    owner: owner._id,
  });

  if (!video) {
    throw new ApiError(500, "Error occurred while saving video");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, video, "Video uploaded successfully"));
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  // Validate the videoId
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }

  // Find the video by ID
  const video = await Video.findById(videoId);

  // Check if the video was found
  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  // Return the video details
  return res
    .status(200)
    .json(new ApiResponse(200, video, "Video fetched successfully"));
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { title, description } = req.body;

  // Validate the videoId
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }

  // Prepare the update object
  const updateData = {};
  if (title) updateData.title = title;
  if (description) updateData.description = description;

  // Check if a thumbnail is being uploaded
  if (req.file) {
    const thumbnailLocalPath = req.file.path;
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);
    if (!thumbnail) {
      throw new ApiError(500, "Failed to upload thumbnail");
    }
    updateData.thumbnail = thumbnail.url;
  }

  // Update the video
  const updatedVideo = await Video.findByIdAndUpdate(videoId, updateData, {
    new: true,
  });

  // Check if the video was found and updated
  if (!updatedVideo) {
    throw new ApiError(404, "Video not found");
  }

  // Return the updated video details
  return res
    .status(200)
    .json(new ApiResponse(200, updatedVideo, "Video updated successfully"));
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  // Validate the videoId
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }

  // Delete the video
  const deletedVideo = await Video.findByIdAndDelete(videoId);

  // Check if the video was deleted
  if (!deletedVideo) {
    throw new ApiError(404, "Video not found");
  }

  // Return a success message
  return res
    .status(200)
    .json(new ApiResponse(200, null, "Video deleted successfully"));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  // Validate the videoId
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }

  // Find the video by ID
  const video = await Video.findById(videoId);

  // Check if the video was found
  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  // Toggle the publish status
  video.isPublished = !video.isPublished;

  // Save the updated video
  await video.save();

  return res
    .status(200)
    .json(
      new ApiResponse(200, video, "Video publish status toggled successfully")
    );
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
