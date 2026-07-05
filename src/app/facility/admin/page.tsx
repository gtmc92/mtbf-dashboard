import { RawUploadPanel } from "@/components/data-upload/RawUploadPanel";
import { MaintenanceAnalysisView } from "@/components/facility/MaintenanceAnalysisView";

export default function FacilityAdminPage() {
  return (
    <MaintenanceAnalysisView
      title="유지보수 분석 · Admin"
      titleAccessory={
        <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600">
          Admin
        </span>
      }
      afterFilters={
        <section aria-labelledby="raw-upload-heading" className="space-y-3">
          <div>
            <h2 id="raw-upload-heading" className="text-lg font-bold text-gray-900">
              원본 데이터 업로드
            </h2>
          </div>
          <RawUploadPanel />
        </section>
      }
    />
  );
}
