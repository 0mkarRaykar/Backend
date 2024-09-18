import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const healthcheck = asyncHandler(async (req, res) => {
  //TODO: build a healthcheck response that simply returns the OK status as json with a message
  const isHealthy = true;

  if (!isHealthy) {
    throw new ApiError(503, "Something is not working");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, "", "Everything works perfectly"));
});

export { healthcheck };
