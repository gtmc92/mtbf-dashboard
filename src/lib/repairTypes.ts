export const FABRICATION_INSTALL_REPAIR_TYPE = "제작설치";
export const LEGACY_FABRICATION_REPAIR_TYPE = "일반제작";

export function normalizeRepairType(repairType: string | null | undefined): string | null {
  if (!repairType) return null;
  const trimmed = repairType.trim();
  if (!trimmed) return null;
  return trimmed === LEGACY_FABRICATION_REPAIR_TYPE
    ? FABRICATION_INSTALL_REPAIR_TYPE
    : trimmed;
}

export function isImprovementRepairType(repairType: string | null | undefined): boolean {
  const normalized = normalizeRepairType(repairType);
  return normalized === FABRICATION_INSTALL_REPAIR_TYPE || normalized === "개발작업";
}
