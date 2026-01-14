// src/components/layout/header/Header.tsx
// !!! no "use client"
import React from "react";
import HeaderClient from "./HeaderClient";
import type { StaticImageData } from "next/image";

type SimpleBrand = {
  name: string;
  email?: string;
  phone?: string;
  website?: string;
  socials?: Record<string, string>;
};

export type HeaderProps = {
  brand?: SimpleBrand;
  logoSrc?: StaticImageData | string;
};

export default function Header({ brand, logoSrc }: HeaderProps) {
  // Eğer brand gelmezse HeaderClient site_settings üzerinden dolduracak.
  return <HeaderClient brand={brand} logoSrc={logoSrc} />;
}
