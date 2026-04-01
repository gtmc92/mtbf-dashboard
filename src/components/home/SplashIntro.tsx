"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

interface Props {
  onDone: () => void;
}

export function SplashIntro({ onDone }: Props) {
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(true);

  useEffect(() => {
    const t1 = setTimeout(() => setVisible(true), 50);
    const t2 = setTimeout(() => setVisible(false), 1800);
    const t3 = setTimeout(() => {
      setMounted(false);
      localStorage.setItem("deerfos_splash_done", "1");
      onDone();
    }, 2350);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [onDone]);

  if (!mounted) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-white transition-opacity duration-500 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
    >
      <Image
        src="/ci-img-1.png"
        alt="Deerfos"
        width={120}
        height={120}
        priority
        className="mb-6"
      />
      <p className="text-2xl font-bold tracking-widest text-green-600 mb-3">
        DEERFOS
      </p>
      <p className="text-base text-gray-700 mb-1">
        설비 신뢰성을 데이터로 관리하다
      </p>
      <p className="text-xs text-gray-400">
        디어포스 설비 신뢰성 관리 &amp; 분석 플랫폼
      </p>
    </div>
  );
}
