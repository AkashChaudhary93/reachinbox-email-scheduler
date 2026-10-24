import React from "react";

type IconProps = { size?: number; className?: string };

const base = (size = 18) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
});

export const MailIcon = ({ size, className }: IconProps) => (
  <svg {...base(size)} className={className}><rect x="3" y="5" width="18" height="14" rx="3" /><path d="m4 7 8 6 8-6" /></svg>
);

export const SendIcon = ({ size, className }: IconProps) => (
  <svg {...base(size)} className={className}><path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" /></svg>
);

export const ClockIcon = ({ size, className }: IconProps) => (
  <svg {...base(size)} className={className}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
);

export const CheckIcon = ({ size, className }: IconProps) => (
  <svg {...base(size)} className={className}><path d="m20 6-11 11-5-5" /></svg>
);

export const AlertIcon = ({ size, className }: IconProps) => (
  <svg {...base(size)} className={className}><path d="M12 9v4" /><path d="M12 17h.01" /><path d="M10.3 3.9 2.6 17a2 2 0 0 0 1.7 3h15.4a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" /></svg>
);

export const SearchIcon = ({ size, className }: IconProps) => (
  <svg {...base(size)} className={className}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
);

export const PlusIcon = ({ size, className }: IconProps) => (
  <svg {...base(size)} className={className}><path d="M12 5v14M5 12h14" /></svg>
);

export const CloseIcon = ({ size, className }: IconProps) => (
  <svg {...base(size)} className={className}><path d="M18 6 6 18M6 6l12 12" /></svg>
);

export const RefreshIcon = ({ size, className }: IconProps) => (
  <svg {...base(size)} className={className}><path d="M21 12a9 9 0 1 1-3-6.7L21 8" /><path d="M21 3v5h-5" /></svg>
);

export const LogoutIcon = ({ size, className }: IconProps) => (
  <svg {...base(size)} className={className}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="m16 17 5-5-5-5" /><path d="M21 12H9" /></svg>
);

export const ChevronIcon = ({ size, className }: IconProps) => (
  <svg {...base(size)} className={className}><path d="m9 18 6-6-6-6" /></svg>
);

export const UploadIcon = ({ size, className }: IconProps) => (
  <svg {...base(size)} className={className}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="m17 8-5-5-5 5" /><path d="M12 3v12" /></svg>
);

export const UsersIcon = ({ size, className }: IconProps) => (
  <svg {...base(size)} className={className}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
);

export const SparkIcon = ({ size, className }: IconProps) => (
  <svg {...base(size)} className={className}><path d="M12 3v4M12 17v4M3 12h4M17 12h4" /><path d="m5.6 5.6 2.8 2.8M15.6 15.6l2.8 2.8M18.4 5.6l-2.8 2.8M8.4 15.6l-2.8 2.8" /></svg>
);
