import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/videoModel.js";
import { User } from "../models/userModel.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/fileUpload.js";

const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
  //TODO: get all videos based on query, sort, pagination

  const videos = await Video.find({});

  if (!videos || videos.length === 0) {
    throw new ApiError(404, "No video to display");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, videos, "Videos fetched successfully"));
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
  //TODO: get video by id
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: update video details like title, description, thumbnail
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: delete video
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
