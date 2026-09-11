import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LONG } from "@/lib/flow";
import { Input } from "./Input";
import { Textarea } from "./Textarea";

describe("maks-lengde på felt", () => {
  it("Textarea har skjemaets grense som standard, og ingen når det sendes eksplisitt", () => {
    render(
      <>
        <Textarea aria-label="a" />
        <Textarea aria-label="b" maxLength={undefined} />
        <Textarea aria-label="c" maxLength={10} />
      </>,
    );
    expect(screen.getByLabelText("a")).toHaveAttribute("maxlength", String(LONG));
    expect(screen.getByLabelText("b")).not.toHaveAttribute("maxlength");
    expect(screen.getByLabelText("c")).toHaveAttribute("maxlength", "10");
  });

  it("Input oppfører seg likt", () => {
    render(
      <>
        <Input aria-label="a" />
        <Input aria-label="b" maxLength={undefined} />
      </>,
    );
    expect(screen.getByLabelText("a")).toHaveAttribute("maxlength", "200");
    expect(screen.getByLabelText("b")).not.toHaveAttribute("maxlength");
  });
});
