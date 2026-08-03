import { useCallback, useEffect, useRef } from "react";
import { useSectionSaveStore } from "@/store/sectionSaveStore";

export function useSectionSave(sectionId: string) {
  const { register, setDirty, unregister } = useSectionSaveStore();
  const isDirtyRef = useRef(false);

  const markDirty = useCallback(() => {
    if (!isDirtyRef.current) {
      isDirtyRef.current = true;
      setDirty(sectionId, true);
    }
  }, [sectionId, setDirty]);

  const markClean = useCallback(() => {
    isDirtyRef.current = false;
    setDirty(sectionId, false);
  }, [sectionId, setDirty]);

  const registerSave = useCallback(
    (saveFn: () => Promise<void>) => {
      register(sectionId, async () => {
        await saveFn();
        isDirtyRef.current = false;
        setDirty(sectionId, false);
      });
    },
    [sectionId, register, setDirty]
  );

  useEffect(() => () => unregister(sectionId), [sectionId, unregister]);

  return { markDirty, markClean, registerSave };
}
