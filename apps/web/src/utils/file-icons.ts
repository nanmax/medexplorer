/**
 * Map a file extension to a Material Symbols icon name + Tailwind classes
 * for the colored badge that wraps it. Pure presentation — kept on the FE
 * so the domain model has zero knowledge of UI concerns.
 */
export interface FileIcon {
  name: string;
  /** Tailwind classes for the rounded badge background */
  bgClass: string;
  /** Tailwind classes for the icon color */
  iconClass: string;
}

const FALLBACK: FileIcon = {
  name: "insert_drive_file",
  bgClass: "bg-surface-container-high",
  iconClass: "text-on-surface-variant",
};

const ICONS: Record<string, FileIcon> = {
  // Documents
  pdf: { name: "picture_as_pdf", bgClass: "bg-error-container/60", iconClass: "text-error" },
  doc: { name: "article", bgClass: "bg-tertiary-fixed/60", iconClass: "text-on-tertiary-container" },
  docx: { name: "article", bgClass: "bg-tertiary-fixed/60", iconClass: "text-on-tertiary-container" },
  rtf: { name: "article", bgClass: "bg-tertiary-fixed/60", iconClass: "text-on-tertiary-container" },
  odt: { name: "article", bgClass: "bg-tertiary-fixed/60", iconClass: "text-on-tertiary-container" },

  // Spreadsheets
  xls: { name: "table_chart", bgClass: "bg-secondary-container/50", iconClass: "text-secondary" },
  xlsx: { name: "table_chart", bgClass: "bg-secondary-container/50", iconClass: "text-secondary" },
  csv: { name: "table_chart", bgClass: "bg-secondary-container/50", iconClass: "text-secondary" },
  tsv: { name: "table_chart", bgClass: "bg-secondary-container/50", iconClass: "text-secondary" },
  ods: { name: "table_chart", bgClass: "bg-secondary-container/50", iconClass: "text-secondary" },

  // Slides
  ppt: { name: "slideshow", bgClass: "bg-error-container/60", iconClass: "text-error" },
  pptx: { name: "slideshow", bgClass: "bg-error-container/60", iconClass: "text-error" },
  odp: { name: "slideshow", bgClass: "bg-error-container/60", iconClass: "text-error" },
  key: { name: "slideshow", bgClass: "bg-error-container/60", iconClass: "text-error" },

  // Images
  png: { name: "image", bgClass: "bg-primary-fixed/60", iconClass: "text-on-primary-container" },
  jpg: { name: "image", bgClass: "bg-primary-fixed/60", iconClass: "text-on-primary-container" },
  jpeg: { name: "image", bgClass: "bg-primary-fixed/60", iconClass: "text-on-primary-container" },
  gif: { name: "gif", bgClass: "bg-primary-fixed/60", iconClass: "text-on-primary-container" },
  webp: { name: "image", bgClass: "bg-primary-fixed/60", iconClass: "text-on-primary-container" },
  bmp: { name: "image", bgClass: "bg-primary-fixed/60", iconClass: "text-on-primary-container" },
  tiff: { name: "image", bgClass: "bg-primary-fixed/60", iconClass: "text-on-primary-container" },
  svg: { name: "image", bgClass: "bg-primary-fixed/60", iconClass: "text-on-primary-container" },
  heic: { name: "image", bgClass: "bg-primary-fixed/60", iconClass: "text-on-primary-container" },

  // Video
  mp4: { name: "movie", bgClass: "bg-tertiary-fixed-dim/60", iconClass: "text-on-tertiary-fixed" },
  mov: { name: "movie", bgClass: "bg-tertiary-fixed-dim/60", iconClass: "text-on-tertiary-fixed" },
  avi: { name: "movie", bgClass: "bg-tertiary-fixed-dim/60", iconClass: "text-on-tertiary-fixed" },
  mkv: { name: "movie", bgClass: "bg-tertiary-fixed-dim/60", iconClass: "text-on-tertiary-fixed" },
  webm: { name: "movie", bgClass: "bg-tertiary-fixed-dim/60", iconClass: "text-on-tertiary-fixed" },
  wmv: { name: "movie", bgClass: "bg-tertiary-fixed-dim/60", iconClass: "text-on-tertiary-fixed" },

  // Audio
  mp3: { name: "audiotrack", bgClass: "bg-secondary-container/50", iconClass: "text-secondary" },
  wav: { name: "audiotrack", bgClass: "bg-secondary-container/50", iconClass: "text-secondary" },
  flac: { name: "audiotrack", bgClass: "bg-secondary-container/50", iconClass: "text-secondary" },
  ogg: { name: "audiotrack", bgClass: "bg-secondary-container/50", iconClass: "text-secondary" },
  m4a: { name: "audiotrack", bgClass: "bg-secondary-container/50", iconClass: "text-secondary" },
  aac: { name: "audiotrack", bgClass: "bg-secondary-container/50", iconClass: "text-secondary" },

  // Archives
  zip: { name: "folder_zip", bgClass: "bg-surface-variant", iconClass: "text-on-surface-variant" },
  rar: { name: "folder_zip", bgClass: "bg-surface-variant", iconClass: "text-on-surface-variant" },
  "7z": { name: "folder_zip", bgClass: "bg-surface-variant", iconClass: "text-on-surface-variant" },
  tar: { name: "folder_zip", bgClass: "bg-surface-variant", iconClass: "text-on-surface-variant" },
  gz: { name: "folder_zip", bgClass: "bg-surface-variant", iconClass: "text-on-surface-variant" },

  // Code / config
  js: { name: "code", bgClass: "bg-primary-container/30", iconClass: "text-on-primary-container" },
  ts: { name: "code", bgClass: "bg-primary-container/30", iconClass: "text-on-primary-container" },
  jsx: { name: "code", bgClass: "bg-primary-container/30", iconClass: "text-on-primary-container" },
  tsx: { name: "code", bgClass: "bg-primary-container/30", iconClass: "text-on-primary-container" },
  json: { name: "data_object", bgClass: "bg-primary-container/30", iconClass: "text-on-primary-container" },
  xml: { name: "data_object", bgClass: "bg-primary-container/30", iconClass: "text-on-primary-container" },
  yaml: { name: "data_object", bgClass: "bg-primary-container/30", iconClass: "text-on-primary-container" },
  yml: { name: "data_object", bgClass: "bg-primary-container/30", iconClass: "text-on-primary-container" },
  html: { name: "code", bgClass: "bg-primary-container/30", iconClass: "text-on-primary-container" },
  css: { name: "code", bgClass: "bg-primary-container/30", iconClass: "text-on-primary-container" },
  py: { name: "code", bgClass: "bg-primary-container/30", iconClass: "text-on-primary-container" },
  java: { name: "code", bgClass: "bg-primary-container/30", iconClass: "text-on-primary-container" },
  go: { name: "code", bgClass: "bg-primary-container/30", iconClass: "text-on-primary-container" },
  rs: { name: "code", bgClass: "bg-primary-container/30", iconClass: "text-on-primary-container" },
  rb: { name: "code", bgClass: "bg-primary-container/30", iconClass: "text-on-primary-container" },
  php: { name: "code", bgClass: "bg-primary-container/30", iconClass: "text-on-primary-container" },
  sh: { name: "terminal", bgClass: "bg-primary-container/30", iconClass: "text-on-primary-container" },

  // Plain text
  txt: { name: "description", bgClass: "bg-surface-container-high", iconClass: "text-on-surface-variant" },
  md: { name: "description", bgClass: "bg-surface-container-high", iconClass: "text-on-surface-variant" },
  log: { name: "description", bgClass: "bg-surface-container-high", iconClass: "text-on-surface-variant" },

  // Medical imaging
  dcm: { name: "imagesmode", bgClass: "bg-secondary-container/50", iconClass: "text-secondary" },
  nii: { name: "imagesmode", bgClass: "bg-secondary-container/50", iconClass: "text-secondary" },

  // Executables / installers
  exe: { name: "terminal", bgClass: "bg-error-container/40", iconClass: "text-error" },
  msi: { name: "terminal", bgClass: "bg-error-container/40", iconClass: "text-error" },
  apk: { name: "android", bgClass: "bg-secondary-container/50", iconClass: "text-secondary" },
  dmg: { name: "package_2", bgClass: "bg-surface-variant", iconClass: "text-on-surface-variant" },

  // Fonts
  ttf: { name: "font_download", bgClass: "bg-tertiary-fixed/60", iconClass: "text-on-tertiary-container" },
  otf: { name: "font_download", bgClass: "bg-tertiary-fixed/60", iconClass: "text-on-tertiary-container" },
  woff: { name: "font_download", bgClass: "bg-tertiary-fixed/60", iconClass: "text-on-tertiary-container" },
  woff2: { name: "font_download", bgClass: "bg-tertiary-fixed/60", iconClass: "text-on-tertiary-container" },
};

export function iconForFile(extension: string | null | undefined): FileIcon {
  if (!extension) return FALLBACK;
  return ICONS[extension.toLowerCase()] ?? FALLBACK;
}
