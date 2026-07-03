// 수리유형 → 관리구분 매핑. DATA_TYPE 기준표(RepairTypeMaster)가 우선, 없으면 고정 매핑 사용.

export const DEFAULT_MANAGEMENT_TYPE_MAP: Record<string, string> = {
  휴무수리: "Preventive",
  보전수리: "Preventive",
  가동수리: "Reactive",
  정지수리: "Reactive",
  일반제작: "Non-Repair",
  개발작업: "Non-Repair",
  유지보수: "Non-Repair",
};

export interface ManagementTypeResolution {
  managementType: string | null;
  warning: string | null;
}

export function resolveManagementType(
  repairType: string | null,
  masterMap: Map<string, string>
): ManagementTypeResolution {
  if (!repairType) {
    return { managementType: null, warning: "수리유형 없음 - 관리구분 미분류" };
  }
  const fromMaster = masterMap.get(repairType);
  if (fromMaster) return { managementType: fromMaster, warning: null };

  const fromDefault = DEFAULT_MANAGEMENT_TYPE_MAP[repairType];
  if (fromDefault) return { managementType: fromDefault, warning: null };

  return {
    managementType: null,
    warning: `수리유형 미등록: "${repairType}" - 관리구분을 자동으로 판정할 수 없어 미분류 처리됨`,
  };
}
