import { useState } from "react";

interface TeamLogoProps {
  logo: string;
  name: string;
  shortName?: string;
  className?: string;
}

const TeamLogo = ({ logo, name, shortName, className = "h-12 w-12" }: TeamLogoProps) => {
  const [failed, setFailed] = useState(false);

  if (!logo.startsWith("http") || failed) {
    return (
      <span
        className="flex items-center justify-center rounded-full bg-muted/50 font-display font-bold text-foreground text-xs"
        style={{ width: "3rem", height: "3rem" }}
        aria-label={name}
      >
        {shortName || logo}
      </span>
    );
  }

  return (
    <img
      src={logo}
      alt={name}
      className={`${className} object-contain`}
      onError={() => setFailed(true)}
    />
  );
};

export default TeamLogo;
