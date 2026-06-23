interface SectionTitleProps {
  title: string;
  subtitle?: string;
  rightElement?: React.ReactNode;
}

export default function SectionTitle({ title, subtitle, rightElement }: SectionTitleProps) {
  return (
    <div className="flex items-center justify-between mb-3">
      <div>
        <h2 className="text-lg font-bold text-[#1F2937]">{title}</h2>
        {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
      {rightElement}
    </div>
  );
}
