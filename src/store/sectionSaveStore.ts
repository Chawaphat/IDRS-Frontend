import { create } from "zustand";

interface SectionEntry {
  isDirty: boolean;
  save: () => Promise<void>;
}

interface SectionSaveStore {
  sections: Record<string, SectionEntry>;
  register: (id: string, save: () => Promise<void>) => void;
  setDirty: (id: string, dirty: boolean) => void;
  unregister: (id: string) => void;
  hasAnyDirty: () => boolean;
}

export const useSectionSaveStore = create<SectionSaveStore>((set, get) => ({
  sections: {},

  register: (id, save) =>
    set((state) => ({
      sections: {
        ...state.sections,
        [id]: { isDirty: state.sections[id]?.isDirty ?? false, save },
      },
    })),

  setDirty: (id, dirty) =>
    set((state) => ({
      sections: {
        ...state.sections,
        [id]: { ...state.sections[id], isDirty: dirty },
      },
    })),

  unregister: (id) =>
    set((state) => {
      const next = { ...state.sections };
      delete next[id];
      return { sections: next };
    }),

  hasAnyDirty: () => Object.values(get().sections).some((s) => s.isDirty),
}));
