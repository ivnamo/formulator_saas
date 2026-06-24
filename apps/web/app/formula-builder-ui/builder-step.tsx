import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";
import type { BuilderSectionKey } from "../formula-builder-model";

type BuilderStepProps = {
  section: BuilderSectionKey;
  title: string;
  summary: ReactNode;
  isOpen: boolean;
  bodyClassName?: string;
  onToggle: (section: BuilderSectionKey) => void;
  children: ReactNode;
};

export function BuilderStep({
  section,
  title,
  summary,
  isOpen,
  bodyClassName = "",
  onToggle,
  children,
}: BuilderStepProps) {
  return (
    <section className="builderStep" data-open={isOpen}>
      <button
        className="builderStepHeader"
        type="button"
        data-track-click="builder_section_toggle"
        data-track-section={section}
        data-track-state={isOpen ? "open" : "closed"}
        onClick={() => onToggle(section)}
      >
        <span>
          <strong>{title}</strong>
          <small>{summary}</small>
        </span>
        <ChevronDown size={18} />
      </button>
      {isOpen ? <div className={`builderStepBody ${bodyClassName}`.trim()}>{children}</div> : null}
    </section>
  );
}
