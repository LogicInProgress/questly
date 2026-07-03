// Entry pack: boots the React SPA into the Rails-rendered shell (#questly-root).
import { createRoot } from "react-dom/client"
import { App } from "@/App"
import "@/theme/tokens.css"

const container = document.getElementById("questly-root")

if (container) {
  createRoot(container).render(<App />)
}
