/**
 * Map known top-level folder names to the icons used in the medexplorer.html
 * design mock. Unknown names fall back to a generic folder icon.
 *
 * Pure presentation concern — kept on the FE so the domain model stays clean.
 */
const CATEGORY_ICON_MAP: Record<string, string> = {
  "Shared Files": "folder_shared",
  "Patient Records": "folder_shared",
  "Lab Results": "biotech",
  "Clinical Trials": "clinical_notes",
  Archive: "archive",
};

export function iconForRootFolder(name: string): string {
  return CATEGORY_ICON_MAP[name] ?? "folder";
}
