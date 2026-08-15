import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

import productsRoutes from "./routes/products.js";
import contactRoutes from "./routes/contact.js";
import adminRoutes from "./routes/admin.js";
import { uploadsDir } from "./middleware/upload.js";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 4000;

// CLIENT_ORIGIN accepts a comma-separated list so the same server can serve
// both your local dev machine and other devices on the LAN, e.g.:
// CLIENT_ORIGIN=http://localhost:5173,http://192.168.1.23:5173
const allowedOrigins = (process.env.CLIENT_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((o) => o.trim());

app.use(
  cors({
    origin(origin, callback) {
      // requests with no origin (curl, server-to-server) are always allowed
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} not allowed by CORS`));
      }
    },
  })
);
app.use(express.json());

// uploaded product images, served at http://<host>:<port>/uploads/<filename>
app.use("/uploads", express.static(uploadsDir));

app.get("/api/health", (req, res) => res.json({ status: "ok" }));

app.use("/api", productsRoutes);
app.use("/api", contactRoutes);
app.use("/api", adminRoutes);

app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

// centralized error handler — catches multer errors (bad file type, too
// large, etc.) and anything passed to next(err), and returns JSON instead
// of Express's default HTML error page
app.use((err, req, res, next) => {
  if (!err) return next();
  console.error(err);
  const status = err.status || 400;
  res.status(status).json({ error: err.message || "Something went wrong" });
});

// listen on 0.0.0.0 (all network interfaces) so other machines on the LAN
// can reach this API using this machine's local IP, not just "localhost"
app.listen(PORT, "0.0.0.0", () => {
  console.log(`TRISAK API listening on http://0.0.0.0:${PORT}`);
});
