import { categoryStyle } from "../lib/categoryStyle";

const SIZES = {
  sm: { box: "h-6 w-6 rounded-md", icon: 13, text: "text-xs" },
  md: { box: "h-8 w-8 rounded-lg", icon: 16, text: "text-sm" },
};

export default function CategoryBadge({ name, size = "md" }) {
  const { Icon, soft } = categoryStyle(name);
  const s = SIZES[size] || SIZES.md;
  return (
    <span className="inline-flex items-center gap-2">
      <span
        className={`flex items-center justify-center ${s.box} ${soft}`}
        aria-hidden
      >
        <Icon size={s.icon} />
      </span>
      <span
        className={`font-medium text-slate-700 dark:text-slate-200 ${s.text}`}
      >
        {name}
      </span>
    </span>
  );
}
