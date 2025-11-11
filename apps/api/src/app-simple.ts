import express from "express";
import cors from "cors";
import { errorHandler } from "./middlewares/errorHandler";

import authRoutes from "./modules/auth/auth.routes";
import userRoutes from "./modules/users/users.routes";
import clientRoutes from "./modules/clients/clients.routes";
import essenceRoutes from "./modules/essences/essences.routes";
import qualiteRoutes from "./modules/qualites/qualites.routes";
import scieurRoutes from "./modules/scieurs/scieurs.routes";
import qualityGroupRoutes from "./modules/quality-groups/quality-groups.routes";
import lotConventionRoutes from "./modules/lot-conventions/lot-conventions.routes";
import chantierRoutes from "./modules/chantiers/chantiers.routes";
import saisieRoutes from "./modules/saisies/saisies.routes";
import gpsPointRoutes from "./modules/gps-points/gps-points.routes";
import entrepriseRoutes from "./modules/entreprises/entreprises.routes";

const app = express();

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
      "Cache-Control",
      "Pragma",
      "Expires",
    ],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  }),
);

app.use(express.json());

app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/clients", clientRoutes);
app.use("/essences", essenceRoutes);
app.use("/qualites", qualiteRoutes);
app.use("/scieurs", scieurRoutes);
app.use("/quality-groups", qualityGroupRoutes);
app.use("/lot-conventions", lotConventionRoutes);
app.use("/chantiers", chantierRoutes);
app.use("/saisies", saisieRoutes);
app.use("/gps-points", gpsPointRoutes);
app.use("/entreprises", entrepriseRoutes);

app.use(errorHandler);
export default app;
