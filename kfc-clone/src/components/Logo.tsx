import Image from "next/image";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  className?: string;
}

export default function Logo({ size = "md", showText = true, className = "" }: LogoProps) {
  const sizeClasses = {
    sm: "w-10 h-10",
    md: "w-12 h-12 sm:w-16 sm:h-16",
    lg: "w-20 h-20 sm:w-24 sm:h-24",
    xl: "w-32 h-32 sm:w-40 sm:h-40",
  };

  return (
    <div className={`flex items-center gap-2 sm:gap-3 ${className}`}>
      <div className={`relative ${sizeClasses[size]} rounded-full overflow-hidden border-2 border-white shadow-lg`}>
        <Image
          src="/logochoco.jpeg"
          alt="Choco Berry Logo"
          fill
          className="object-cover"
          priority={size === "lg" || size === "xl"}
          sizes={size === "sm" ? "40px" : size === "md" ? "64px" : size === "lg" ? "96px" : "160px"}
        />
      </div>
      {showText && (
        <div className="hidden sm:block">
          <div className="text-lg sm:text-xl font-bold">Choco Berry</div>
          <div className="text-xs text-red-100">Клубника в шоколаде</div>
        </div>
      )}
    </div>
  );
}

