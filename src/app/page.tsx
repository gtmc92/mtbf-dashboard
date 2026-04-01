"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { KPISection, type KpiData } from "@/components/home/KPISection";
import { AlertSection } from "@/components/home/AlertSection";
import { OnboardingModal } from "@/components/home/OnboardingModal";
import { SplashIntro } from "@/components/home/SplashIntro";

const menus = [
  {
    href: "/input",
    title: "데이터 관리",
    description: "설비 운영 데이터 입력 및 관리",
    icon: "📝",
    color: "bg-blue-50 hover:bg-blue-100 border-blue-200",
  },
  {
    href: "/status",
    title: "운영 현황",
    description: "MTBF/MTTR 기반 설비 상태 조회",
    icon: "📊",
    color: "bg-green-50 hover:bg-green-100 border-green-200",
  },
  {
    href: "/compare",
    title: "성과 분석",
    description: "기간별 신뢰성 비교 및 트렌드 분석",
    icon: "📈",
    color: "bg-orange-50 hover:bg-orange-100 border-orange-200",
  },
  {
    href: "/facility",
    title: "유지보수 분석",
    description: "수리 유형 및 설비 문제 원인 분석",
    icon: "🔧",
    color: "bg-purple-50 hover:bg-purple-100 border-purple-200",
  },
];

export default function Home() {
  const [kpiData, setKpiData] = useState<KpiData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSplash, setShowSplash] = useState(false);
  const [splashDone, setSplashDone] = useState(false);

  useEffect(() => {
    fetch("/api/home/kpi")
      .then((r) => r.json())
      .then((d) => setKpiData(d))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!localStorage.getItem("deerfos_splash_done")) {
      setShowSplash(true);
    } else {
      setSplashDone(true);
    }
  }, []);

  return (
    <main className="min-h-screen bg-gray-50">
      {showSplash && (
        <SplashIntro
          onDone={() => {
            setShowSplash(false);
            setSplashDone(true);
          }}
        />
      )}
      {splashDone && <OnboardingModal />}
      {/* 헤더 */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-5xl mx-auto px-6 py-5 flex items-center gap-5">
          {/* CI 로고 */}
          <Image
            src="/ci-img-1.png"
            alt="Deerfos logo"
            width={64}
            height={64}
            className="shrink-0"
            priority
          />
          {/* 브랜드명 + 시스템명 */}
          <div>
            <p className="text-xs font-semibold tracking-widest text-green-600 uppercase mb-0.5">
              DEERFOS
            </p>
            <h1 className="text-xl font-bold text-gray-900 leading-tight">
              설비 신뢰성 관리 &amp; 분석 플랫폼
            </h1>
            <p className="text-gray-400 mt-0.5 text-xs">
              공장별 신뢰성 지표 및 유지보수 인사이트 통합 관리
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-10">
        {/* 메뉴 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {menus.map((menu) => (
            <Link key={menu.href} href={menu.href}>
              <Card
                className={`cursor-pointer transition-colors border-2 h-full ${menu.color}`}
              >
                <CardHeader>
                  <div className="text-4xl mb-2">{menu.icon}</div>
                  <CardTitle className="text-lg">{menu.title}</CardTitle>
                  <CardDescription>{menu.description}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>

        {/* KPI 요약 */}
        <KPISection data={kpiData} loading={loading} />

        {/* ALERT */}
        <AlertSection data={kpiData} />

        {/* 핵심 KPI 정의 */}
        <div className="mt-10">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            핵심 KPI 정의
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base text-blue-700">
                  MTBF (Mean Time Between Failures)
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-gray-600">
                <p>
                  <strong>고장간격</strong> = 가동시간 ÷ 정지횟수
                </p>
                <p className="mt-1 text-gray-500">
                  값이 클수록 설비 신뢰성이 높음 ↑
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base text-orange-700">
                  MTTR (Mean Time To Repair)
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-gray-600">
                <p>
                  <strong>수리복구시간</strong> = 정지시간 ÷ 정지횟수
                </p>
                <p className="mt-1 text-gray-500">
                  값이 작을수록 빠른 복구를 의미 ↓
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}
