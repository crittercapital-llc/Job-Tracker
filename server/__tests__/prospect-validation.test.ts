import { validateProspect, getNextStatus, isTerminalStatus } from "../prospect-helpers";
import { insertProspectSchema } from "@shared/schema";

describe("validateProspect", () => {
  const validBase = { companyName: "Google", roleTitle: "Software Engineer" };

  describe("required fields", () => {
    test("rejects a blank company name", () => {
      const result = validateProspect({ companyName: "", roleTitle: "Software Engineer" });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Company name is required");
    });

    test("rejects a missing company name", () => {
      const result = validateProspect({ roleTitle: "Software Engineer" });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Company name is required");
    });

    test("rejects a blank role title", () => {
      const result = validateProspect({ companyName: "Google", roleTitle: "" });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Role title is required");
    });

    test("rejects a missing role title", () => {
      const result = validateProspect({ companyName: "Google" });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Role title is required");
    });

    test("accepts valid required fields", () => {
      const result = validateProspect(validBase);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test("collects multiple errors at once", () => {
      const result = validateProspect({ companyName: "", roleTitle: "" });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Company name is required");
      expect(result.errors).toContain("Role title is required");
    });
  });

  describe("status validation", () => {
    test("accepts valid statuses", () => {
      const statuses = ["Bookmarked", "Applied", "Phone Screen", "Interviewing", "Offer", "Rejected", "Withdrawn"];
      for (const status of statuses) {
        const result = validateProspect({ ...validBase, status });
        expect(result.valid).toBe(true);
      }
    });

    test("rejects an invalid status", () => {
      const result = validateProspect({ ...validBase, status: "InvalidStatus" });
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toMatch(/Status must be one of/);
    });

    test("passes when status is not provided", () => {
      const result = validateProspect(validBase);
      expect(result.valid).toBe(true);
    });
  });

  describe("interest level validation", () => {
    test("accepts valid interest levels", () => {
      for (const level of ["High", "Medium", "Low"]) {
        const result = validateProspect({ ...validBase, interestLevel: level });
        expect(result.valid).toBe(true);
      }
    });

    test("rejects an invalid interest level", () => {
      const result = validateProspect({ ...validBase, interestLevel: "VeryHigh" });
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toMatch(/Interest level must be one of/);
    });
  });

  describe("salary validation", () => {
    test("accepts a valid positive integer salary", () => {
      const result = validateProspect({ ...validBase, salary: 120000 });
      expect(result.valid).toBe(true);
    });

    test("accepts null salary (clearing the field)", () => {
      const result = validateProspect({ ...validBase, salary: null });
      expect(result.valid).toBe(true);
    });

    test("accepts undefined salary (not provided)", () => {
      const result = validateProspect({ ...validBase, salary: undefined });
      expect(result.valid).toBe(true);
    });

    test("rejects zero salary", () => {
      const result = validateProspect({ ...validBase, salary: 0 });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Salary must be a positive whole number");
    });

    test("rejects negative salary", () => {
      const result = validateProspect({ ...validBase, salary: -50000 });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Salary must be a positive whole number");
    });

    test("rejects decimal salary", () => {
      const result = validateProspect({ ...validBase, salary: 75000.50 });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Salary must be a positive whole number");
    });

    test("rejects non-numeric salary string", () => {
      const result = validateProspect({ ...validBase, salary: "abc" });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Salary must be a positive whole number");
    });
  });
});

describe("insertProspectSchema (Zod)", () => {
  const validData = {
    companyName: "Google",
    roleTitle: "Software Engineer",
    status: "Bookmarked" as const,
    interestLevel: "Medium" as const,
  };

  describe("required fields", () => {
    test("accepts valid minimal input", () => {
      const result = insertProspectSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    test("rejects empty company name", () => {
      const result = insertProspectSchema.safeParse({ ...validData, companyName: "" });
      expect(result.success).toBe(false);
    });

    test("rejects empty role title", () => {
      const result = insertProspectSchema.safeParse({ ...validData, roleTitle: "" });
      expect(result.success).toBe(false);
    });
  });

  describe("optional fields", () => {
    test("accepts null jobUrl", () => {
      const result = insertProspectSchema.safeParse({ ...validData, jobUrl: null });
      expect(result.success).toBe(true);
    });

    test("accepts null notes", () => {
      const result = insertProspectSchema.safeParse({ ...validData, notes: null });
      expect(result.success).toBe(true);
    });

    test("applies default status when omitted", () => {
      const { status, ...rest } = validData;
      const result = insertProspectSchema.safeParse(rest);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe("Bookmarked");
      }
    });

    test("applies default interestLevel when omitted", () => {
      const { interestLevel, ...rest } = validData;
      const result = insertProspectSchema.safeParse(rest);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.interestLevel).toBe("Medium");
      }
    });
  });

  describe("status enum", () => {
    test("rejects an invalid status", () => {
      const result = insertProspectSchema.safeParse({ ...validData, status: "Nope" });
      expect(result.success).toBe(false);
    });
  });

  describe("interest level enum", () => {
    test("rejects an invalid interest level", () => {
      const result = insertProspectSchema.safeParse({ ...validData, interestLevel: "VeryHigh" });
      expect(result.success).toBe(false);
    });
  });

  describe("salary", () => {
    test("accepts a valid positive integer salary", () => {
      const result = insertProspectSchema.safeParse({ ...validData, salary: 150000 });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.salary).toBe(150000);
      }
    });

    test("accepts null salary", () => {
      const result = insertProspectSchema.safeParse({ ...validData, salary: null });
      expect(result.success).toBe(true);
    });

    test("accepts undefined salary (omitted)", () => {
      const result = insertProspectSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    test("rejects negative salary", () => {
      const result = insertProspectSchema.safeParse({ ...validData, salary: -1 });
      expect(result.success).toBe(false);
    });

    test("rejects zero salary", () => {
      const result = insertProspectSchema.safeParse({ ...validData, salary: 0 });
      expect(result.success).toBe(false);
    });

    test("rejects non-integer salary", () => {
      const result = insertProspectSchema.safeParse({ ...validData, salary: 99999.99 });
      expect(result.success).toBe(false);
    });

    test("rejects string salary", () => {
      const result = insertProspectSchema.safeParse({ ...validData, salary: "120000" });
      expect(result.success).toBe(false);
    });
  });
});

describe("getNextStatus", () => {
  test("advances Bookmarked to Applied", () => {
    expect(getNextStatus("Bookmarked")).toBe("Applied");
  });

  test("advances Applied to Phone Screen", () => {
    expect(getNextStatus("Applied")).toBe("Phone Screen");
  });

  test("advances Phone Screen to Interviewing", () => {
    expect(getNextStatus("Phone Screen")).toBe("Interviewing");
  });

  test("does not advance terminal statuses", () => {
    expect(getNextStatus("Offer")).toBe("Offer");
    expect(getNextStatus("Rejected")).toBe("Rejected");
    expect(getNextStatus("Withdrawn")).toBe("Withdrawn");
  });

  test("returns current status for unknown status", () => {
    expect(getNextStatus("Unknown")).toBe("Unknown");
  });
});

describe("isTerminalStatus", () => {
  test("returns true for terminal statuses", () => {
    expect(isTerminalStatus("Offer")).toBe(true);
    expect(isTerminalStatus("Rejected")).toBe(true);
    expect(isTerminalStatus("Withdrawn")).toBe(true);
  });

  test("returns false for non-terminal statuses", () => {
    expect(isTerminalStatus("Bookmarked")).toBe(false);
    expect(isTerminalStatus("Applied")).toBe(false);
    expect(isTerminalStatus("Interviewing")).toBe(false);
  });
});
