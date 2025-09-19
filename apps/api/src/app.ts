import express from "express";
import cors from "cors";
import { errorHandler } from "./middlewares/errorHandler";

import authRoutes from "./modules/auth/auth.routes";
import userRoutes from "./modules/users/users.routes";
import essenceRoutes from "./modules/essences/essences.routes";
import chantierRoutes from "./modules/chantiers/chantiers.routes";
import saisieRoutes from "./modules/saisies/saisies.routes";
import usersRoutes  from "./modules/users/users.routes";

const app = express();
app.use(cors({ origin: true, credentials: false })); 
app.use(express.json());

app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/essences", essenceRoutes);
app.use("/chantiers", chantierRoutes);
app.use("/saisies", saisieRoutes);
app.use("/users", usersRoutes);

app.use(errorHandler);
export default app;