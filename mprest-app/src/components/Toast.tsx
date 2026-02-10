import { useState, useRef, useCallback, useImperativeHandle, forwardRef } from "react";

export interface ToastRef {
  show: (message: string, interval?: number) => void;
  hide: () => void;
}

interface ToastProps {
  /** Default display duration in ms (default: 3000) */
  interval?: number;
}

export const Toast = forwardRef<ToastRef, ToastProps>(({ interval = 3000 }, ref) => {
  const [message, setMessage] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const hide = useCallback(() => {
    clearTimeout(timer.current);
    setMessage(null);
  }, []);

  const show = useCallback((msg: string, ms?: number) => {
    setMessage(msg);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setMessage(null), ms ?? interval);
  }, [interval]);

  useImperativeHandle(ref, () => ({ show, hide }), [show, hide]);

  if (!message) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: "80px",
        left: "50%",
        transform: "translateX(-50%)",
        background: "linear-gradient(135deg, rgba(0, 0, 0, 0.9), rgba(30, 30, 30, 0.85))",
        backdropFilter: "blur(10px)",
        color: "#e5e7eb",
        borderRadius: "10px",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
        padding: "10px 18px",
        fontSize: "12px",
        fontFamily: "'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace",
        fontWeight: 500,
        zIndex: 1001,
        maxWidth: "500px",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
      }}
    >
      {message}
    </div>
  );
});
