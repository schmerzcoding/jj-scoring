import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  DANCE_STYLE_SELECT_OPTIONS,
  WORKSHOP_LEVEL_OPTIONS,
} from "@/lib/workshops";
import type { DanceStyle, WorkshopLevel } from "@/types/database";

export function WorkshopCreateFields({
  danceStyle,
  danceStyleOther,
  workshopLevels,
  instructors,
  onDanceStyleChange,
  onDanceStyleOtherChange,
  onWorkshopLevelsChange,
  onInstructorsChange,
}: {
  danceStyle: DanceStyle | "";
  danceStyleOther: string;
  workshopLevels: WorkshopLevel[];
  instructors: string;
  onDanceStyleChange: (value: DanceStyle | "") => void;
  onDanceStyleOtherChange: (value: string) => void;
  onWorkshopLevelsChange: (levels: WorkshopLevel[]) => void;
  onInstructorsChange: (value: string) => void;
}) {
  function toggleLevel(level: WorkshopLevel) {
    if (workshopLevels.includes(level)) {
      onWorkshopLevelsChange(workshopLevels.filter((entry) => entry !== level));
      return;
    }
    onWorkshopLevelsChange([...workshopLevels, level]);
  }

  return (
    <div className="space-y-4 rounded-xl border border-cyan-900/40 bg-cyan-950/20 p-4">
      <div>
        <h3 className="text-sm font-semibold text-foreground">Workshop details</h3>
        <p className="mt-1 text-xs text-muted">
          Style, level, and instructor information for this workshop.
        </p>
      </div>

      <Select
        label="Dance style"
        value={danceStyle}
        onChange={(e) => onDanceStyleChange(e.target.value as DanceStyle | "")}
        options={[{ value: "", label: "Select a style" }, ...DANCE_STYLE_SELECT_OPTIONS]}
        required
      />

      {danceStyle === "other" && (
        <Input
          label="Specify dance style"
          value={danceStyleOther}
          onChange={(e) => onDanceStyleOtherChange(e.target.value)}
          placeholder="e.g. West Coast Swing"
          required
        />
      )}

      <fieldset className="space-y-2">
        <legend className="block text-sm font-medium text-muted-foreground">
          Workshop levels
        </legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {WORKSHOP_LEVEL_OPTIONS.map((option) => (
            <label
              key={option.value}
              className="flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm text-foreground transition-colors hover:border-brand-700/50"
            >
              <input
                type="checkbox"
                checked={workshopLevels.includes(option.value)}
                onChange={() => toggleLevel(option.value)}
                className="rounded border-border bg-surface-raised text-brand-500 focus:ring-brand-600/30"
              />
              {option.label}
            </label>
          ))}
        </div>
      </fieldset>

      <div>
        <label className="block text-sm font-medium text-muted-foreground">
          Instructor(s)
        </label>
        <textarea
          value={instructors}
          onChange={(e) => onInstructorsChange(e.target.value)}
          rows={3}
          required
          placeholder="One name per line, or comma-separated"
          className="mt-1 block w-full rounded-xl border border-border bg-surface-raised px-3 py-2.5 text-sm text-foreground shadow-inner shadow-black/10 placeholder:text-muted/70 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/30"
        />
        <p className="mt-1 text-xs text-muted">At least one instructor is required.</p>
      </div>
    </div>
  );
}
