import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/userModel.js";
import { Subscription } from "../models/subscriptionModel.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// Toggle subscription to a channel
const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  const userId = req.user._id; // Assume req.user._id is from the verifyJWT middleware

  if (!isValidObjectId(channelId)) {
    throw new ApiError(400, "Invalid Channel ID");
  }

  // Check if subscription already exists
  let subscription = await Subscription.findOne({
    subscriber: userId,
    channel: channelId,
  });

  if (subscription) {
    // If already subscribed, unsubscribe (remove subscription)
    await subscription.remove();
    return res
      .status(200)
      .json(new ApiResponse(200, "Unsubscribed successfully"));
  } else {
    // Subscribe if not already subscribed
    subscription = await Subscription.create({
      subscriber: userId,
      channel: channelId,
    });
    return res
      .status(201)
      .json(new ApiResponse(201, "Subscribed successfully", subscription));
  }
});

// Get all subscribers for a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  if (!isValidObjectId(channelId)) {
    throw new ApiError(400, "Invalid Channel ID");
  }

  const subscribers = await Subscription.find({ channel: channelId }).populate(
    "subscriber",
    "name email"
  );
  return res
    .status(200)
    .json(
      new ApiResponse(200, "Subscribers fetched successfully", subscribers)
    );
});

// Get all channels to which a user is subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
  const { subscriberId } = req.params;

  if (!isValidObjectId(subscriberId)) {
    throw new ApiError(400, "Invalid Subscriber ID");
  }

  const subscribedChannels = await Subscription.find({
    subscriber: subscriberId,
  }).populate("channel", "name email");
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        "Subscribed channels fetched successfully",
        subscribedChannels
      )
    );
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
