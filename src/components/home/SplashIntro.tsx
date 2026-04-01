"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

interface Props {
  onDone: () => void;
}

export function SplashIntro({ onDone }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // fade-in
    const t1 = setTimeout(() => setVisible(true), 50);
    // fade-out 시작 (2.5초 유지)
    const t2 = setTimeout(() => setVisible(false), 2600);
    // 완료 (fade-out 0.6초 후)
    const t3 = setTimeout(() => {
      localStorage.setItem("deerfos_splash_done", "1");
      onDone();
    }, 3200);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [onDone]);

  return (
    <div
      className={`min-h-screen flex flex-col items-center justify-center bg-white transition-opacity duration-600 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
    >
      <Image
        src="/ci-img-1.png"
        alt="Deerfos"
        width={180}
        height={180}
        priority
        className="mb-8"
      />
      <p className="text-4xl font-bold tracking-widest text-green-600 mb-4">
        DEERFOS
      </p>
      <p className="text-xl text-gray-700 mb-2">
        설비 신뢰성을 데이터로 관리하다
      </p>
      <p className="text-sm text-gray-400">
        디어포스 설비 신뢰성 관리 &amp; 분석 플랫폼
      </p>
    </div>
  );
}
