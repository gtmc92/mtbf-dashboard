import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  const menus = [
    {
      href: "/input",
      title: "데이터 입력",
      description: "연도/공장/공정별 월간 가동시간·정지횟수·정지시간 입력",
      icon: "📝",
      color: "bg-blue-50 hover:bg-blue-100 border-blue-200",
    },
    {
      href: "/status",
      title: "현황 조회",
      description: "공정별 MTBF/MTTR 월간 현황 테이블 조회",
      icon: "📊",
      color: "bg-green-50 hover:bg-green-100 border-green-200",
    },
    {
      href: "/compare",
      title: "연도 비교",
      description: "전년도 대비 MTBF/MTTR 비교 차트 및 요약표",
      icon: "📈",
      color: "bg-orange-50 hover:bg-orange-100 border-orange-200",
    },
  ];

  return (
    <main className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-5xl mx-auto px-6 py-6">
          <h1 className="text-2xl font-bold text-gray-900">
            설비 MTBF &amp; MTTR 관리 시스템
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            공장별 설비 신뢰성 지표 입력·조회·비교
          </p>
        </div>
      </div>

      {/* 메뉴 카드 */}
      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

        {/* 용어 설명 */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-4">
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
    </main>
  );
}
