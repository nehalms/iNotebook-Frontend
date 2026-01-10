import { useEffect, useState } from "react";

type CountdownProps = {
  startSeconds?: number;
  message?: string;
  onFinish: () => void;
};

export default function Countdown({
  startSeconds = 5,
  message = "Calling API in",
  onFinish,
}: CountdownProps) {
  const [seconds, setSeconds] = useState(startSeconds);

  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds((prev) => {
        if (prev === 1) {
          clearInterval(interval);
          onFinish();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [onFinish]);

  return (
    <div className="text-sm">
      {message} {seconds} seconds...
    </div>
  );
}
