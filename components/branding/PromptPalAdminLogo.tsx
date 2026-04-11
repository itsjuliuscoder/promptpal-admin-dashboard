import Image from "next/image";
import React from "react";

type PromptPalAdminLogoProps = {
  className?: string;
  /** When true, preloads the logo (e.g. login LCP). */
  priority?: boolean;
};

/**
 * Brand logo for dark backgrounds (admin login header), using raster assets from /public/images.
 */
export default function PromptPalAdminLogo({
  className = "",
  priority = false,
}: PromptPalAdminLogoProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-2 ${className}`}
    >
      <Image
        src="/images/logo-dark.png"
        alt="PromptPal"
        width={220}
        height={56}
        className="h-12 w-auto max-w-[min(100%,220px)] object-contain object-center"
        priority={priority}
      />
      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/50">
        Admin
      </span>
    </div>
  );
}
