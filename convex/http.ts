import { httpRouter } from "convex/server";
import { authComponent, createAuth } from "./auth";

const http = httpRouter();

// Registers all Better Auth routing endpoints on /api/auth/* under Convex
authComponent.registerRoutes(http, createAuth);

export default http;
