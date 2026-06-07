import { hydrateRoot } from "react-dom/client";
import { StartClient } from "@tanstack/start";
import { createRouter } from "./router";

const router = createRouter();

// Mount/hydrate the SSR-rendered document on the client. Without this explicit
// hydrateRoot call the page renders server-side (visible text) but stays inert:
// React never takes over, so Clerk never initializes and interactive elements
// (login button, board) have no event handlers attached.
hydrateRoot(document, <StartClient router={router} />);
