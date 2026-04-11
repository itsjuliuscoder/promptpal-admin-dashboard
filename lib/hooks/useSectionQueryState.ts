"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export function useSectionQueryState(validSections: string[], defaultSection: string) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const activeSection = useMemo(() => {
    const current = searchParams.get("section");
    return current && validSections.includes(current) ? current : defaultSection;
  }, [defaultSection, searchParams, validSections]);

  const setActiveSection = useCallback(
    (section: string) => {
      if (!validSections.includes(section)) return;

      const params = new URLSearchParams(searchParams.toString());
      if (section === defaultSection) {
        params.delete("section");
      } else {
        params.set("section", section);
      }

      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [defaultSection, pathname, router, searchParams, validSections]
  );

  return { activeSection, setActiveSection };
}
