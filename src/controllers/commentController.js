import mongoose from "mongoose";
import { Comment } from "../models/commentModel.js";
import { Video } from "../models/videoModel.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getVideoComments = asyncHandler(async (req, res) => {
  //TODO: get all comments for a video
  const { videoId } = req.params;

  const video = await Video.findById(videoId);
  ("nice video");
  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  const comment = await Comment.find({ video: videoId }).populate(
    "owner",
    "username avatar"
  );

  return res
    .status(200)
    .json(new ApiResponse(200, comment, "Comments fetched successfully"));
});

const addComment = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { content } = req.body;

  if (!content || content.trim() === "") {
    throw new ApiError(400, "Comment content cannot be empty");
  }

  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  // Create and save the comment
  const comment = await Comment.create({
    video: videoId,
    owner: req.user._id,
    content,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, comment, "Comment added successfully"));
});

const updateComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const { content } = req.body;

  // Check if the new content is valid
  if (!content || content.trim() === "") {
    throw new ApiError(400, "Comment content cannot be empty");
  }

  // Find the comment by ID and populate the owner field
  const comment = await Comment.findById(commentId).populate("owner");

  // Check if the comment exists
  if (!comment) {
    throw new ApiError(404, "Comment not found");
  }

  // Safeguard: Check if the comment has an owner
  if (!comment.owner || !comment.owner._id) {
    throw new ApiError(403, "Comment has no owner or invalid owner");
  }

  // Check if the comment owner is the authenticated user
  if (comment.owner._id.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You are not authorized to update this comment");
  }

  // Update the comment content
  comment.content = content;

  // Save the updated comment
  await comment.save();

  return res
    .status(200)
    .json(new ApiResponse(200, comment, "Comment updated successfully"));
});

const deleteComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;

  const comment = await Comment.findByIdAndDelete(commentId);

  if (!comment) {
    throw new ApiError(404, "Comment not found");
  }

  // Check if the comment owner is the authenticated user
  if (comment.owner._id.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You are not authorized to delete this comment");
  }

  // Delete the comment
  await comment.deleteOne();

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Comment deleted successfully"));
});

export { getVideoComments, addComment, updateComment, deleteComment };
