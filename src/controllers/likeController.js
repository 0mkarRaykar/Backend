import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/likeModel.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/videoModel.js";
import { Comment } from "../models/commentModel.js";
import { Tweet } from "../models/tweetModel.js";

// Helper function to toggle likes
const toggleLike = async (userId, entityId, entityModel, entityField) => {
  // Find the like record for the given entity and user
  let like = await Like.findOne({
    [entityField]: entityId,
    likedBy: userId,
  });

  if (like) {
    // If the like record exists, toggle the `isLiked` field
    like.isLiked = !like.isLiked;
    await like.save();
  } else {
    // If no like record exists, create one
    like = await Like.create({
      [entityField]: entityId,
      likedBy: userId,
      isLiked: true,
    });
  }

  return like;
};

const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const userId = req.user._id;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }

  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  const like = await toggleLike(userId, videoId, Video, "video");

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        like,
        like.isLiked ? "Video liked successfully" : "Like removed from video"
      )
    );
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const userId = req.user._id;

  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalid comment ID");
  }

  const comment = await Comment.findById(commentId);
  if (!comment) {
    throw new ApiError(404, "Comment not found");
  }

  const like = await toggleLike(userId, commentId, Comment, "comment");

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        like,
        like.isLiked
          ? "Comment liked successfully"
          : "Like removed from comment"
      )
    );
});

const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  const userId = req.user._id;

  if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, "Invalid tweet ID");
  }

  const tweet = await Tweet.findById(tweetId);
  if (!tweet) {
    throw new ApiError(404, "Tweet not found");
  }

  const like = await toggleLike(userId, tweetId, Tweet, "tweet");

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        like,
        like.isLiked ? "Tweet liked successfully" : "Like removed from tweet"
      )
    );
});

// Function to get all videos liked by a user
const getLikedVideos = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // Find all likes associated with videos for the user
  const likedVideos = await Like.find({
    likedBy: userId,
    isLiked: true,
    video: { $exists: true },
  })
    .populate("video")
    .select("video");

  if (!likedVideos.length) {
    throw new ApiError(404, "No liked videos found for this user");
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      likedVideos.map((like) => like.video),
      "Liked videos fetched successfully"
    )
  );
});

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };
