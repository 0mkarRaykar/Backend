import mongoose, { isValidObjectId } from "mongoose";
import { Tweet } from "../models/tweetModel.js";
import { User } from "../models/userModel.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createTweet = asyncHandler(async (req, res) => {
  const { content } = req.body;

  if (!content || content.trim() === "") {
    throw new ApiError(400, "Tweet content cannot be empty");
  }

  const user = await User.findById(req.user?._id);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const tweet = await Tweet.create({
    owner: req.user._id,
    content,
  });
  return res
    .status(201)
    .json(new ApiResponse(201, tweet, "Tweet added successfully"));
});

const getUserTweets = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  const user = await User.findById(userId);

  // Validate user ID
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new ApiError(400, "Invalid user ID");
  }

  const tweet = await Tweet.find({ owner: userId }).populate(
    "owner",
    "username avatar"
  );

  // Check if the user has tweets
  if (!tweet.length) {
    throw new ApiError(404, "No tweets found for this user");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, tweet, "Tweet fetched successfully"));
});

const updateTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  const { content } = req.body;

  // Check if the new content is valid
  if (!content || content.trim() === "") {
    throw new ApiError(400, "Tweet content cannot be empty");
  }

  // Find the tweet by ID and populate the owner field
  const tweet = await Tweet.findById(tweetId).populate("owner");

  // Check if the tweet exists
  if (!tweet) {
    throw new ApiError(404, "Tweet not found");
  }

  // Safeguard: Check if the tweet has an owner
  if (!tweet.owner || !tweet.owner._id) {
    throw new ApiError(403, "Tweet has no owner or invalid owner");
  }

  // Check if the tewwt owner is the authenticated user
  if (tweet.owner._id.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You are not authorized to update this tweet");
  }

  // Update the tweet content
  tweet.content = content;

  // Save the updated tweet
  await tweet.save();

  return res
    .status(200)
    .json(new ApiResponse(200, tweet, "tweet updated successfully"));
});

const deleteTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;

  const tweet = await Tweet.findByIdAndDelete(tweetId);

  if (!tweet) {
    throw new ApiError(404, "Tweet not found");
  }

  // Check if the tweet owner is the authenticated user
  if (tweet.owner._id.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You are not authorized to delete this tweet");
  }

  // Delete the tweet
  await tweet.deleteOne();

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Tweet deleted successfully"));
});

export { createTweet, getUserTweets, updateTweet, deleteTweet };
