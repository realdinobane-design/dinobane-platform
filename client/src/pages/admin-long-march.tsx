import { AdminTimelineEditor } from "@/pages/admin-timeline-editor";
import { LONG_MARCH_DATA } from "@/pages/long-march";

/**
 * Admin editor for the Long March page.
 * Kept as a thin wrapper for backwards compatibility with the /admin/long-march
 * route. All the real UI lives in the generic AdminTimelineEditor.
 */
export default function AdminLongMarchPage() {
  return (
    <AdminTimelineEditor
      slug="long-march"
      fallback={LONG_MARCH_DATA}
      viewPath="/long-march"
    />
  );
}
