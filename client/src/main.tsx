import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { BudgetProvider } from "./contexts/BudgetContext";

// Initialize app with the BudgetProvider to manage global state
createRoot(document.getElementById("root")!).render(
  <BudgetProvider>
    <App />
  </BudgetProvider>
);
