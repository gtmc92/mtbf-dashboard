"use client";

import { useState, useEffect } from "react";

const STORAGE_KEY = "deerfos_onboarding_done";

const MENU_ITEMS = [
  { icon: "📝", title: "데이터 관리", desc: "설비 운영 데이터 입력" },
  { icon: "📊", title: "운영 현황", desc: "MTBF/MTTR 기반 상태 확인" },
  { icon: "📈", title: "성과 분석", desc: "기간별 신뢰성 비교" },
  { icon: "🔧", title: "유지보수 분석", desc: "수리 및 설비 문제 분석" },
];

export function OnboardingModal() {
  const [open, setOpen] = useState(false);
  const [neverShow, setNeverShow] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      setOpen(true);
    }
  }, []);

  const close = () => {
    if (neverShow) {
      localStorage.setItem(STORAGE_KEY, "1");
    }
    setOpen(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
        {/* 제목 */}
        <h2 className="text-lg font-bold text-gray-900 mb-1">
          디어포스 설비 신뢰성 관리 &amp; 분석 플랫폼
        </h2>
        <p className="text-xs text-gray-500 mb-5">
          본 시스템은 설비 신뢰성 향상과 유지보수 효율 개선을 위한 의사결정 지원
          플랫폼입니다.
        </p>

        {/* 메뉴 안내 */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {MENU_ITEMS.map((item) => (
            <div
              key={item.title}
              className="flex items-start gap-2 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2.5"
            >
              <span className="text-xl mt-0.5">{item.icon}</span>
              <div>
                <p className="text-sm font-semibold text-gray-800">
                  {item.title}
                </p>
                <p className="text-xs text-gray-500">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* 다시 보지 않기 */}
        <label className="flex items-center gap-2 text-xs text-gray-500 mb-4 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={neverShow}
            onChange={(e) => setNeverShow(e.target.checked)}
            className="accent-green-600"
          />
          다시 보지 않기
        </label>

        {/* 버튼 */}
        <div className="flex justify-end gap-2">
          <button
            onClick={close}
            className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700"
          >
            닫기
          </button>
          <button
            onClick={close}
            className="px-4 py-1.5 text-sm font-semibold bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            시작하기
          </button>
        </div>
      </div>
    </div>
  );
}
