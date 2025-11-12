import { useContext } from "react";
import { AuthCtx } from "../contexts/auth-context.js";

export const useAuth = () => useContext(AuthCtx);
