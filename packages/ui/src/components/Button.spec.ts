import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import Button from "./Button.vue";

describe("UiButton", () => {
  it("renders default slot content", () => {
    const wrapper = mount(Button, { slots: { default: "Save" } });
    expect(wrapper.text()).toContain("Save");
  });

  it("emits click when not disabled", async () => {
    const wrapper = mount(Button, { slots: { default: "Go" } });
    await wrapper.trigger("click");
    expect(wrapper.emitted("click")).toHaveLength(1);
  });

  it("does not emit click when disabled", async () => {
    const wrapper = mount(Button, {
      props: { disabled: true },
      slots: { default: "Go" },
    });
    await wrapper.trigger("click");
    expect(wrapper.emitted("click")).toBeUndefined();
    expect(wrapper.attributes("disabled")).toBeDefined();
  });

  it("disables and shows spinner while loading", () => {
    const wrapper = mount(Button, {
      props: { loading: true },
      slots: { default: "Saving" },
    });
    expect(wrapper.attributes("disabled")).toBeDefined();
    expect(wrapper.find(".animate-spin").exists()).toBe(true);
  });

  it("applies secondary variant classes", () => {
    const wrapper = mount(Button, {
      props: { variant: "secondary" },
      slots: { default: "B" },
    });
    expect(wrapper.classes()).toContain("bg-secondary-container");
  });
});
