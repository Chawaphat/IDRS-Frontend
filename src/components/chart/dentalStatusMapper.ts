/* eslint-disable @typescript-eslint/no-explicit-any */
import type { OdontogramStatusSnapshot } from "@/components/odontogram/odontogram";
import type {
  CariesData,
  DentalStatusBulkCreate,
  DentalStatusResponse,
  EdentulousData,
  FillingData,
  ImplantData,
  PeriodontalData,
  RestorationData,
  ToothData,
  ToothSurfaceEnum,
  ToothTypeEnum,
  VitalityData,
} from "@/services/types/dentalStatus";

const NOTE_STATE_PREFIX = "IDRS_ODONTOGRAM_STATE_V1:";

const surfaceToBackend: Record<string, ToothSurfaceEnum | undefined> = {
  mesial: "M",
  distal: "D",
  buccal: "B",
  lingual: "L",
  palatal: "P",
  occlusal: "O",
};

const surfaceToUi: Record<string, string> = {
  M: "mesial",
  D: "distal",
  B: "buccal",
  L: "lingual",
  P: "lingual",
  O: "occlusal",
};

function cleanText(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function toNullableNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

function compactNote(...parts: Array<unknown>): string | null {
  const text = parts.map(cleanText).filter(Boolean) as string[];
  return text.length > 0 ? text.join("\n") : null;
}

function restorationMaterialToBackend(material: string | undefined | null) {
  if (material === "zircon") return "zirconia";
  if (material === "emax") return "lithium_disilicate";
  if (material === "metal") return "full_metal";
  if (material === "pfm" || material === "pfz") return material;
  return null;
}

function restorationMaterialToUi(material: string | undefined | null) {
  if (material === "zirconia") return "zircon";
  if (material === "lithium_disilicate" || material === "emax") return "emax";
  if (material === "full_metal") return "metal";
  if (material === "pfm" || material === "pfz") return material;
  return "none";
}

function materialToCrownMaterial(material: string) {
  if (material === "zircon" || material === "pfz") return "zircon";
  if (material === "metal" || material === "pfm") return "metal";
  if (material === "emax") return "emax";
  return "natural";
}

function implantComponentToBackend(value: string | undefined | null) {
  if (value === "cover-screw") return "cover_screw";
  if (value === "healing-abutment") return "healing_abutment";
  if (value === "bridge" || value === "crown") return value;
  return "cover_screw";
}

function implantComponentToUi(value: string | undefined | null) {
  if (value === "cover_screw") return "cover-screw";
  if (value === "healing_abutment") return "healing-abutment";
  if (value === "bridge" || value === "crown") return value;
  return "none";
}

function retentionToBackend(value: string | undefined | null) {
  if (value === "screw") return "screw_retained";
  if (value === "cement") return "cement_retained";
  return null;
}

function retentionToUi(value: string | undefined | null) {
  if (value === "screw_retained") return "screw";
  if (value === "cement_retained") return "cement";
  return "none";
}

function rootCanalToBackend(value: string | undefined | null) {
  if (value === "medicated" || value === "incomplete" || value === "completed") return value;
  return "no";
}

function rootCanalToUi(value: string | undefined | null) {
  if (value === "medicated" || value === "incomplete" || value === "completed") return value;
  return "no-endo";
}

function mobilityToBackend(value: string | undefined | null) {
  if (value === "m1") return "M1";
  if (value === "m2") return "M2";
  if (value === "m3") return "M3";
  return null;
}

function mobilityToUi(value: string | undefined | null) {
  if (value === "M1") return "m1";
  if (value === "M2") return "m2";
  if (value === "M3") return "m3";
  return "none";
}

function restorationTypeToBackend(value: string | undefined | null) {
  if (value === "crown" || value === "bridge" || value === "veneer" || value === "onlay" || value === "vonlay" || value === "overlay") {
    return value;
  }
  return null;
}

function restorationTypeToUi(value: string | undefined | null) {
  if (value === "crown" || value === "bridge" || value === "veneer" || value === "onlay" || value === "vonlay" || value === "overlay") {
    return value;
  }
  return "none";
}

function encodeStateNote(state: Record<string, any>): string {
  // state.caries and state.mods are already arrays (serializeState converts Sets before snapshot)
  return `${NOTE_STATE_PREFIX}${JSON.stringify(state)}`;
}

function decodeStateNote(note: string | null | undefined): Record<string, any> | null {
  if (!note?.startsWith(NOTE_STATE_PREFIX)) return null;
  try {
    const parsed = JSON.parse(note.slice(NOTE_STATE_PREFIX.length));
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

function toothTypeFromState(state: Record<string, any>): ToothTypeEnum {
  if (state.toothSelection === "implant") return "implant";
  if (state.toothSelection === "milktooth") return "primary";
  if (
    state.toothSelection === "none" ||
    state.toothSelection === "tooth-under-gum" ||
    state.toothSelection === "no-tooth-after-extraction"
  ) {
    return "edentulous";
  }
  return "permanent";
}

function buildEdentulous(state: Record<string, any>, toothType: ToothTypeEnum): EdentulousData | null {
  if (toothType !== "edentulous") return null;
  if (state.toothSelection === "tooth-under-gum") {
    return { edentulous_type: "impacted", note: compactNote(state.note) };
  }
  return {
    edentulous_type: state.extractionWound ? "extraction" : "missing",
    note: compactNote(state.note),
  };
}

function buildCaries(state: Record<string, any>): CariesData[] {
  if (!Array.isArray(state.caries_data)) return [];
  return state.caries_data
    .map((item: any) => {
      const surfaceStr = item?.surface?.replace("caries-", "");
      const surface = surfaceToBackend[surfaceStr];
      if (!surface || !["enamel", "dentine", "pulp"].includes(item?.depth)) return null;
      return {
        surface,
        depth: item.depth,
        note: cleanText(state.cariesNote),
      } as CariesData;
    })
    .filter(Boolean) as CariesData[];
}

function buildFillings(state: Record<string, any>): FillingData[] {
  if (!Array.isArray(state.filling_data)) return [];
  const grouped = new Map<string, Set<ToothSurfaceEnum>>();

  for (const item of state.filling_data) {
    const surface = surfaceToBackend[item?.surface?.replace("filling-surface-", "")];
    const material = item?.material;
    if (!surface || !["composite", "amalgam", "gic", "temporary"].includes(material)) continue;
    if (!grouped.has(material)) grouped.set(material, new Set());
    grouped.get(material)?.add(surface);
  }

  return Array.from(grouped.entries()).map(([material, surfaces]) => ({
    surfaces: Array.from(surfaces),
    material: material as FillingData["material"],
    size_mm: toNullableNumber(state.size_mm),
    note: cleanText(state.fillingNote),
  }));
}

function buildPeriodontal(state: Record<string, any>): PeriodontalData | null {
  const mobility = mobilityToBackend(state.mobility);
  const recession = toNullableNumber(state.recession_mm);
  const note = cleanText(state.periodontalNote);
  if (!mobility && recession == null && !note) return null;
  return {
    mobility_grade: mobility,
    recession_mm: recession,
    note,
  };
}

function buildVitality(state: Record<string, any>): VitalityData | null {
  const ept = state.ept_result === "positive" || state.ept_result === "negative" ? state.ept_result : null;
  const rootCanal = rootCanalToBackend(state.root_canal);
  const note = cleanText(state.vitalityNote);
  const pulpStatus = state.pulpInflam ? "inflamed" : null;
  if (!ept && rootCanal === "no" && !note && !pulpStatus) return null;
  return {
    pulp_status: pulpStatus,
    ept_result: ept,
    root_canal_treated: rootCanal,
    note,
  };
}

function buildRestoration(state: Record<string, any>, toothType: ToothTypeEnum): RestorationData | null {
  if (toothType === "implant") return null;
  const type = restorationTypeToBackend(state.restorationType);
  const material = restorationMaterialToBackend(state.restorationMaterial);
  const postType =
    state.postCoreType === "metal-post" ? "metal_post" :
    state.postCoreType === "fiber-post" ? "fiber_post" :
    null;

  const hasCrownMaterial =
    !type &&
    ["zircon", "emax", "metal"].includes(state.crownMaterial);

  const restorationType =
    type ||
    (state.postCore || postType ? "post_and_core" : null) ||
    (hasCrownMaterial ? "crown" : null);

  if (!restorationType) return null;

  return {
    restoration_type: restorationType as RestorationData["restoration_type"],
    material: material || restorationMaterialToBackend(state.crownMaterial),
    post_type: postType,
    note: compactNote(state.restorationNote, state.postCoreNote),
  };
}

function buildImplant(state: Record<string, any>, toothType: ToothTypeEnum): ImplantData | null {
  if (toothType !== "implant") return null;
  const material = restorationMaterialToBackend(state.restorationMaterial);
  return {
    component_type: implantComponentToBackend(state.implant_component) as ImplantData["component_type"],
    retention_type: retentionToBackend(state.retention_type),
    material,
    brand: cleanText(state.implant_brand),
    crown_brand: cleanText(state.crown_brand),
    note: cleanText(state.implantNote),
  };
}

function stateToToothData(toothNumber: number, state: Record<string, any>): ToothData {
  const toothType = toothTypeFromState(state);
  return {
    tooth_number: toothNumber,
    tooth_type: toothType,
    note: encodeStateNote(state),
    edentulous: buildEdentulous(state, toothType),
    caries: buildCaries(state),
    fillings: buildFillings(state),
    periodontal: buildPeriodontal(state),
    vitality: buildVitality(state),
    restorations: buildRestoration(state, toothType),
    implant: buildImplant(state, toothType),
  };
}

function backendToState(tooth: ToothData): Record<string, any> {
  const encodedState = decodeStateNote(tooth.note);
  if (encodedState) return encodedState;

  const state: Record<string, any> = {
    note: tooth.note || "",
  };

  if (tooth.tooth_type === "implant") {
    state.toothSelection = "implant";
  } else if (tooth.tooth_type === "primary") {
    state.toothSelection = "milktooth";
  } else if (tooth.tooth_type === "edentulous") {
    state.toothSelection =
      tooth.edentulous?.edentulous_type === "impacted" || tooth.edentulous?.edentulous_type === "embedded"
        ? "tooth-under-gum"
        : "none";
    state.extractionWound = tooth.edentulous?.edentulous_type === "extraction";
  } else {
    state.toothSelection = "tooth-base";
  }

  if (tooth.caries?.length) {
    state.caries_data = tooth.caries
      .map((caries) => {
        const surface = surfaceToUi[caries.surface];
        return surface ? { surface: `caries-${surface}`, depth: caries.depth } : null;
      })
      .filter(Boolean);
    state.cariesNote = tooth.caries.map((caries) => caries.note).filter(Boolean).join("\n");
  }

  if (tooth.fillings?.length) {
    state.filling_data = tooth.fillings.flatMap((filling) =>
      (filling.surfaces || [])
        .map((surface) => surfaceToUi[surface])
        .filter(Boolean)
        .map((surface) => ({ surface, material: filling.material }))
    );
    state.size_mm = tooth.fillings[0]?.size_mm != null ? String(tooth.fillings[0].size_mm) : "";
    state.fillingNote = tooth.fillings.map((filling) => filling.note).filter(Boolean).join("\n");
  }

  if (tooth.periodontal) {
    state.mobility = mobilityToUi(tooth.periodontal.mobility_grade);
    state.recession_mm = tooth.periodontal.recession_mm != null ? String(tooth.periodontal.recession_mm) : "";
    state.periodontalNote = tooth.periodontal.note || "";
  }

  if (tooth.vitality) {
    state.pulpInflam = tooth.vitality.pulp_status === "inflamed";
    state.ept_result = tooth.vitality.ept_result || "none";
    state.root_canal = rootCanalToUi(tooth.vitality.root_canal_treated);
    state.vitalityNote = tooth.vitality.note || "";
    if (state.root_canal === "completed") state.endo = "endo-filling";
    else if (state.root_canal === "medicated") state.endo = "endo-medical-filling";
    else if (state.root_canal === "incomplete") state.endo = "endo-filling-incomplete";
  }

  if (tooth.restorations) {
    const material = restorationMaterialToUi(tooth.restorations.material);
    state.restorationType = restorationTypeToUi(tooth.restorations.restoration_type);
    state.restorationMaterial = material;
    state.crownMaterial = materialToCrownMaterial(material);
    state.bridgePillar = state.restorationType === "bridge";
    state.restorationNote = tooth.restorations.note || "";
    if (tooth.restorations.post_type) {
      state.postCore = true;
      state.postCoreType = tooth.restorations.post_type === "fiber_post" ? "fiber-post" : "metal-post";
    }
    if (tooth.restorations.restoration_type === "post_and_core") {
      state.postCore = true;
      if (!state.postCoreType) state.postCoreType = "metal-post";
    }
  }

  if (tooth.implant) {
    const material = restorationMaterialToUi(tooth.implant.material);
    state.toothSelection = "implant";
    state.implant_component = implantComponentToUi(tooth.implant.component_type);
    state.retention_type = retentionToUi(tooth.implant.retention_type);
    state.restorationMaterial = material;
    state.crownMaterial = materialToCrownMaterial(material);
    state.implant_brand = tooth.implant.brand || "";
    state.crown_brand = tooth.implant.crown_brand || "";
    state.implantNote = tooth.implant.note || "";
  }

  return state;
}

export function odontogramSnapshotToDentalStatus(snapshot: OdontogramStatusSnapshot): DentalStatusBulkCreate {
  const teeth = Object.entries(snapshot.teeth)
    .map(([toothNumber, state]) => stateToToothData(Number(toothNumber), state))
    .sort((a, b) => a.tooth_number - b.tooth_number);

  return { teeth };
}

export function dentalStatusToOdontogramSnapshot(
  status: DentalStatusResponse | null,
): OdontogramStatusSnapshot {
  const teeth: OdontogramStatusSnapshot["teeth"] = {};
  
  if (status) {
    for (const tooth of status.teeth || []) {
      teeth[tooth.tooth_number] = backendToState(tooth);
    }
  }

  return {
    version: "backend-1",
    globals: {
      wisdomVisible: true,
      showBase: true,
      occlusalVisible: true,
      showHealthyPulp: true,
      edentulous: false,
    },
    teeth,
  };
}
