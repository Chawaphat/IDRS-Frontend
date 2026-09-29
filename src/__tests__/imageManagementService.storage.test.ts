import { describe, it, expect, vi, beforeEach } from "vitest";
import { imageManagementService } from "@/services/imageManagementService";

// ── Mock supabase storage ────────────────────────────────────────────────────
const mockUpload = vi.fn();
const mockRemove = vi.fn();
const mockFrom = vi.fn(() => ({ upload: mockUpload, remove: mockRemove }));

vi.mock("@/lib/supabase", () => ({
  supabase: {
    storage: {
      from: (...args: unknown[]) => mockFrom(...args),
    },
  },
}));

// ── Mock api (imported by the service module, unused in these tests) ──────────
vi.mock("@/lib/api", () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}));

const FIXED_UUID = "11111111-2222-3333-4444-555555555555";

function makeFile(name: string): File {
  return new File(["x"], name, { type: "image/jpeg" });
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(crypto, "randomUUID").mockReturnValue(FIXED_UUID);
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});

// ─────────────────────────────────────────────────────────────────────────────
// UTC-39 : Upload Image File (Storage) — uploadToStorage(file, category)
// ─────────────────────────────────────────────────────────────────────────────
describe("UTC-39: imageManagementService.uploadToStorage", () => {
  // UTC-39-TC-01
  it("TC-01: uploads a valid file to a unique category-prefixed path and returns the generated file name", async () => {
    mockUpload.mockResolvedValueOnce({ error: null });

    const result = await imageManagementService.uploadToStorage(
      makeFile("abc.jpg"),
      "panoramic_xray",
    );

    expect(mockUpload).toHaveBeenCalledTimes(1);
    const [pathArg, fileArg, optionsArg] = mockUpload.mock.calls[0];
    expect(pathArg).toBe(`panoramic_xray/${FIXED_UUID}.jpg`);
    expect(pathArg).toMatch(/^panoramic_xray\/[^/]+\.jpg$/);
    expect(fileArg).toBeInstanceOf(File);
    expect(optionsArg).toEqual({ cacheControl: "3600", upsert: false });
    // returns the file name only, not the full storage path
    expect(result).toBe(`${FIXED_UUID}.jpg`);
  });

  // UTC-39-TC-02
  it('TC-02: throws "Failed to upload image: <message>" when Supabase Storage rejects the upload', async () => {
    mockUpload.mockResolvedValueOnce({
      error: { message: "Payload too large" },
    });

    await expect(
      imageManagementService.uploadToStorage(
        makeFile("abc.jpg"),
        "panoramic_xray",
      ),
    ).rejects.toThrow("Failed to upload image: Payload too large");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// UTC-40 : Delete Image File (Storage) — deleteFromStorage(category, fileName)
// ─────────────────────────────────────────────────────────────────────────────
describe("UTC-40: imageManagementService.deleteFromStorage", () => {
  // UTC-40-TC-01
  it("TC-01: removes the correct category-prefixed path and resolves to true without throwing", async () => {
    mockRemove.mockResolvedValueOnce({ error: null });

    await expect(
      imageManagementService.deleteFromStorage("intraoral", "abc.jpg"),
    ).resolves.toBe(true);

    expect(mockRemove).toHaveBeenCalledWith(["intraoral/abc.jpg"]);
    expect(console.error).not.toHaveBeenCalled();
  });

  // UTC-40-TC-02
  it("TC-02: logs the storage error and resolves to false (never throws) on a deletion error", async () => {
    mockRemove.mockResolvedValueOnce({
      error: { message: "Object not found" },
    });

    await expect(
      imageManagementService.deleteFromStorage("intraoral", "missing.jpg"),
    ).resolves.toBe(false);

    expect(mockRemove).toHaveBeenCalledWith(["intraoral/missing.jpg"]);
    expect(console.error).toHaveBeenCalledWith(
      "Failed to delete from storage:",
      "Object not found",
    );
  });
});
