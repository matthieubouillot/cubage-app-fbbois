import express from "express";
import cors from "cors";
import { errorHandler } from "./middlewares/errorHandler";

import authRoutes from "./modules/auth/auth.routes";
import userRoutes from "./modules/users/users.routes";
import essenceRoutes from "./modules/essences/essences.routes";
import chantierRoutes from "./modules/chantiers/chantiers.routes";
import saisieRoutes from "./modules/saisies/saisies.routes";

const app = express();

// CORS: allow requests from any origin (reflect origin). Adjust if you need to restrict.
app.use(
  cors({
    origin: true,
    credentials: true,
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "Accept",
      "X-Requested-With",
      "Origin",
    ],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  }),
);

app.use(express.json());

app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/essences", essenceRoutes);
app.use("/chantiers", chantierRoutes);
app.use("/saisies", saisieRoutes);
// Note: users routes already mounted above as /users

app.use(errorHandler);
export default app;