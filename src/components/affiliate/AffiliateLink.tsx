"use client";

import React from "react";

interface AffiliateLinkProps {
  href: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
  onMouseEnter?: React.MouseEventHandler<HTMLAnchorElement>;
  onMouseLeave?: React.MouseEventHandler<HTMLAnchorElement>;
  "aria-label"?: string;
}

export function AffiliateLink({
  href,
  children,
  style = {},
  className,
  onMouseEnter,
  onMouseLeave,
  "aria-label": ariaLabel,
}: AffiliateLinkProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="nofollow sponsored noopener"
      data-affiliate="true"
      className={className}
      aria-label={ariaLabel}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{ textDecoration: "none", ...style }}
    >
      {children}
    </a>
  );
}
