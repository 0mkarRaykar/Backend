import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

// routes import
import userRouter from "./routes/userRoutes.js";
import healthcheckRouter from "./routes/healthcheckRoutes.js";
import tweetRouter from "./routes/tweetRoutes.js";
import subscriptionRouter from "./routes/subscriptionRoutes.js";
import videoRouter from "./routes/videoRoutes.js";
import commentRouter from "./routes/commentRoutes.js";
import likeRouter from "./routes/likeRoutes.js";
import playlistRouter from "./routes/playlistRoutes.js";

// routes declaration
app.use("/users", userRouter);
app.use("/healthcheck", healthcheckRouter);
app.use("/tweets", tweetRouter);
app.use("/subscriptions", subscriptionRouter);
app.use("/videos", videoRouter);
app.use("/comments", commentRouter);
app.use("/likes", likeRouter);
app.use("/playlist", playlistRouter);

export { app };
