import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

interface ChatLauncherProps {
  open?: boolean;
  setOpen?: (v: boolean) => void;
}

/**
 * Auto-navigates to /chat on first load after login.
 * Uses sessionStorage to ensure it only triggers once per session.
 */
export function ChatLauncher({ open, setOpen }: ChatLauncherProps) {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const hasLaunched = sessionStorage.getItem("chat-launched");
    
    // Only auto-open on first load of the session, and not if already on /chat
    if (!hasLaunched && location.pathname !== "/chat") {
      sessionStorage.setItem("chat-launched", "true");
      
      if (setOpen) {
        setOpen(true);
      } else {
        navigate("/chat");
      }
    }
  }, [navigate, location.pathname, setOpen]);

  return null;
}
