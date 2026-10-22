import { cn } from "../utils";

describe("Utility function: cn()", () => {
  describe("Positive Cases", () => {
    it("should merge single and multiple static class names correctly", () => {
      expect(cn("bg-red-500", "text-white")).toBe("bg-red-500 text-white");
    });

    it("should resolve Tailwind CSS conflicts, giving precedence to the last class", () => {
      expect(cn("px-2", "px-4")).toBe("px-4");
      expect(cn("text-sm", "text-lg")).toBe("text-lg");
      expect(cn("bg-red-500", "bg-blue-500")).toBe("bg-blue-500");
    });

    it("should handle conditional classes using objects", () => {
      expect(
        cn({
          "bg-green-500": true,
          "text-white": true,
          "opacity-50": false,
        })
      ).toBe("bg-green-500 text-white");
    });

    it("should support array arguments and nested arrays", () => {
      expect(cn(["btn", "btn-primary"], ["p-4", "m-2"])).toBe("btn btn-primary p-4 m-2");
    });
  });

  describe("Negative & Edge Cases", () => {
    it("should return an empty string when no arguments are provided", () => {
      expect(cn()).toBe("");
    });

    it("should filter out undefined, null, false, and empty strings gracefully", () => {
      expect(cn("btn", undefined, null, false, "", "btn-active")).toBe("btn btn-active");
    });

    it("should handle boolean ternary expressions properly", () => {
      const isPrimary = false;
      const isSmall = true;
      expect(
        cn("btn", isPrimary ? "btn-primary" : "btn-secondary", isSmall && "btn-sm")
      ).toBe("btn btn-secondary btn-sm");
    });

    it("should handle whitespace and multiple spaces correctly", () => {
      expect(cn("  flex   items-center  ", "justify-between ")).toBe(
        "flex items-center justify-between"
      );
    });
  });
});
