import mongoose from "mongoose";
import { User } from "../models/userModel.js";
import { Subscription } from "../models/subscriptionModel.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// Helper function to validate ObjectId
const validateObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

// Toggle subscription (subscribe/unsubscribe)
const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  const subscriberId = req.user._id; // Assuming req.user is populated by middleware after authentication

  if (!validateObjectId(channelId) || !validateObjectId(subscriberId)) {
    throw new ApiError(400, "Invalid channel or subscriber ID");
  }

  const channel = await User.findById(channelId);
  if (!channel) {
    throw new ApiError(404, "Channel not found");
  }

  // Check if subscription already exists
  const existingSubscription = await Subscription.findOne({
    channel: channelId,
    subscriber: subscriberId,
  });

  if (existingSubscription) {
    // Unsubscribe
    await Subscription.deleteOne({
      channel: channelId,
      subscriber: subscriberId,
    });
    console.log("Unsubscribed:", subscriberId, "from channel:", channelId); // Debugging log
    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Unsubscribed successfully"));
  } else {
    // Subscribe
    const newSubscription = await Subscription.create({
      channel: channelId,
      subscriber: subscriberId,
    });
    console.log("Subscribed:", newSubscription); // Debugging log
    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Subscribed successfully"));
  }
});

// Get the list of subscribers for a specific channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  // Log the channelId to debug
  console.log("Channel ID received:", channelId);

  // Validate the channelId
  if (!validateObjectId(channelId)) {
    console.log("Invalid channelId:", channelId); // Debugging log
    throw new ApiError(400, "Invalid channel ID");
  }

  // Fetch subscribers
  const subscribers = await Subscription.find({ channel: channelId }).populate(
    "subscriber",
    "username fullName avatar"
  );

  // Log the subscribers for debugging
  console.log("Subscribers found for channel:", channelId, subscribers);

  return res
    .status(200)
    .json(
      new ApiResponse(200, subscribers, "Subscribers fetched successfully")
    );
});
// Get the list of channels to which a user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
  const subscriberId = req.user._id;

  if (!validateObjectId(subscriberId)) {
    throw new ApiError(400, "Invalid subscriber ID");
  }

  const subscriptions = await Subscription.find({
    subscriber: subscriberId,
  }).populate("channel", "username fullName avatar");

  console.log("Subscriptions found for user:", subscriberId, subscriptions); // Debugging log

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        subscriptions,
        "Subscribed channels fetched successfully"
      )
    );
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
