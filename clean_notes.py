import os
import re

frontend_dir = "/Users/chefthanathip/Repositories/IDRS/IDRS-Frontend/src/components/odontogram"

odontogram_ts_path = os.path.join(frontend_dir, "odontogram.ts")
odontogram_wizard_tsx_path = os.path.join(frontend_dir, "OdontogramWizard.tsx")

note_keys = [
    "cariesNote", "fillingNote", "periodontalNote", "vitalityNote",
    "restorationNote", "postCoreNote", "othersNote", "implantNote",
    "note: string", "note: \"\"", "note: s.note", "s.note =", "draft.note =", "state.note"
]

# 1. Clean odontogram.ts
with open(odontogram_ts_path, "r", encoding="utf-8") as f:
    lines = f.readlines()

new_lines = []
for line in lines:
    # If the line contains any of the note_keys that define or export notes, skip it
    skip = False
    for key in note_keys:
        if key in line and "export" not in line and "function" not in line:
            # We want to be careful not to delete legitimate things, but since these are very specific state fields, it's safe.
            # wait, `note: string` might match something else?
            if "toothNoteEl" in line:
                skip = True
            elif "cariesNote" in line or "fillingNote" in line or "periodontalNote" in line or "vitalityNote" in line or "restorationNote" in line or "postCoreNote" in line or "othersNote" in line or "implantNote" in line:
                skip = True
            elif "note: string;" in line or "note: \"\"," in line or "note: s.note" in line or "s.note =" in line:
                skip = True
    if not skip:
        new_lines.append(line)

with open(odontogram_ts_path, "w", encoding="utf-8") as f:
    f.writelines(new_lines)

# 2. Clean OdontogramWizard.tsx
with open(odontogram_wizard_tsx_path, "r", encoding="utf-8") as f:
    wizard_content = f.read()

# Remove NoteInput component definition and its usages
wizard_content = re.sub(r'function NoteInput.*?\}\n', '', wizard_content, flags=re.DOTALL | re.MULTILINE)
wizard_content = re.sub(r'<NoteInput[^>]*/>', '', wizard_content)

# There are multi-line NoteInput usages like:
# <NoteInput
#   label="..."
#   value={...}
#   onChange={...}
# />
wizard_content = re.sub(r'<NoteInput[\s\S]*?/>', '', wizard_content)

with open(odontogram_wizard_tsx_path, "w", encoding="utf-8") as f:
    f.write(wizard_content)

print("Frontend notes cleanup complete.")
