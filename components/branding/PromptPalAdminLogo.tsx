import Image from "next/image";
import React from "react";

type PromptPalAdminLogoProps = {
  className?: string;
  /** When true, preloads the logo (e.g. login LCP). */
  priority?: boolean;
};

/**
 * PromptPal brand mark for the admin login header. Uses the current
 * light-on-dark wordmark so it reads on the dark/purple header.
 */
export default function PromptPalAdminLogo({
  className = "",
  priority = false,
}: PromptPalAdminLogoProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-2.5 ${className}`}
    >
      <Image
        src="/images/promptpal-logo-dark.png"
        alt="PromptPal"
        width={240}
        height={74}
        className="h-9 w-auto max-w-[min(100%,240px)] object-contain object-center"
        priority={priority}
      />
      <span className="text-[11px] font-bold uppercase tracking-[0.28em] text-white/60">
        Admin
      </span>
    </div>
  );
}
