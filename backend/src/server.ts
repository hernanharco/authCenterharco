import "dotenv/config";
import express, { Request, Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/authRoutes";
//import "./types/express";

const app = express();
const PORT = process.env.PORT || 3000;
const FRONTEND_URL = process.env.NEXT_PUBLIC_FRONTEND_URL || "http://localhost:3001";

// --- CORS con cookies ---
app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true,
  })
);

// Body parser JSON
app.use(express.json());

// Parseo de cookies
app.use(cookieParser());

// Rutas
app.use("/auth", authRoutes);

// Ruta de prueba
app.get("/", (req: Request, res: Response) => {
  res.send("Servidor de autenticación Express + TypeScript funcionando.");
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
  console.log(`CORS habilitado para: ${FRONTEND_URL}`);
});
