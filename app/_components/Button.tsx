"use client";

import type { AnchorHTMLAttributes, ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary";

const BASE = "px-3 py-2 rounded-lg text-sm font-medium transition-colors";
const VARIANTS: Record<Variant, string> = {
  primary: "bg-blue-600 hover:bg-blue-500 text-white",
  secondary: "bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200",
};

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  href?: undefined;
};

type AnchorProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  variant?: Variant;
  href: string;
};

type Props = ButtonProps | AnchorProps;

export default function Button({ variant = "primary", className = "", ...rest }: Props) {
  const cls = `${BASE} ${VARIANTS[variant]}${className ? ` ${className}` : ""}`;
  if ("href" in rest && rest.href !== undefined) {
    return <a {...(rest as AnchorProps)} className={cls} />;
  }
  return <button {...(rest as ButtonProps)} className={cls} />;
}
