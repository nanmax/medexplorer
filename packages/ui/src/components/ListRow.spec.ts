import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import ListRow from "./ListRow.vue";

describe("UiListRow", () => {
  it("applies selected styles when selected", () => {
    const wrapper = mount(ListRow, { props: { selected: true } });
    expect(wrapper.classes().join(" ")).toContain("bg-secondary-container");
    expect(wrapper.attributes("aria-selected")).toBe("true");
  });

  it("emits click and dblclick events", async () => {
    const wrapper = mount(ListRow);
    await wrapper.trigger("click");
    await wrapper.trigger("dblclick");
    expect(wrapper.emitted("click")).toHaveLength(1);
    expect(wrapper.emitted("dblclick")).toHaveLength(1);
  });

  it("emits click on Enter key (keyboard accessibility)", async () => {
    const wrapper = mount(ListRow);
    await wrapper.trigger("keydown.enter");
    expect(wrapper.emitted("click")).toHaveLength(1);
  });
});
