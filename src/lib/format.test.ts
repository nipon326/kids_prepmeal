import { describe, expect, it } from "vitest";
import { stripStepNumber } from "./format";

describe("stripStepNumber", () => {
  it("removes a typed step number", () => {
    expect(stripStepNumber("1. เอากระดูกซุปไปต้ม")).toBe("เอากระดูกซุปไปต้ม");
    expect(stripStepNumber("12) ปั้นเป็นก้อน")).toBe("ปั้นเป็นก้อน");
  });

  it("keeps quantities and temperatures", () => {
    expect(stripStepNumber("1.5 ถ้วยน้ำ ต้มให้เดือด")).toBe("1.5 ถ้วยน้ำ ต้มให้เดือด");
    expect(stripStepNumber("180°C อบ 20 นาที")).toBe("180°C อบ 20 นาที");
    expect(stripStepNumber("2 ช้อนโต๊ะ ผสมให้เข้ากัน")).toBe("2 ช้อนโต๊ะ ผสมให้เข้ากัน");
  });
});
