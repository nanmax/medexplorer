import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import Breadcrumb from "./Breadcrumb.vue";

describe("Breadcrumb", () => {
  it("renders a home button + each crumb", () => {
    const wrapper = mount(Breadcrumb, {
      props: {
        crumbs: [
          { id: "1", name: "MRI Scans" },
          { id: "2", name: "Patient_Doe" },
        ],
      },
    });
    const home = wrapper.find('button[aria-label="Go to home"]');
    expect(home.exists()).toBe(true);

    const crumbButtons = wrapper.findAll("button").filter((b) => b.attributes("aria-label") !== "Go to home");
    expect(crumbButtons).toHaveLength(2);
    expect(crumbButtons[0]?.text()).toBe("MRI Scans");
    expect(crumbButtons[1]?.text()).toBe("Patient_Doe");
  });

  it("marks the last crumb as aria-current", () => {
    const wrapper = mount(Breadcrumb, {
      props: {
        crumbs: [
          { id: "1", name: "A" },
          { id: "2", name: "B" },
        ],
      },
    });
    const crumbButtons = wrapper.findAll("button").filter((b) => b.attributes("aria-label") !== "Go to home");
    expect(crumbButtons[1]?.attributes("aria-current")).toBe("page");
    expect(crumbButtons[0]?.attributes("aria-current")).toBeUndefined();
  });

  it("emits navigate event with crumb id when crumb clicked", async () => {
    const wrapper = mount(Breadcrumb, {
      props: { crumbs: [{ id: "abc", name: "X" }] },
    });
    const crumbButton = wrapper.findAll("button").find((b) => b.attributes("aria-label") !== "Go to home");
    await crumbButton!.trigger("click");
    expect(wrapper.emitted("navigate")?.[0]).toEqual(["abc"]);
  });

  it("emits home event when computer icon clicked", async () => {
    const wrapper = mount(Breadcrumb, { props: { crumbs: [] } });
    await wrapper.find('button[aria-label="Go to home"]').trigger("click");
    expect(wrapper.emitted("home")).toHaveLength(1);
  });

  it("renders only home button when no crumbs", () => {
    const wrapper = mount(Breadcrumb, { props: { crumbs: [] } });
    expect(wrapper.findAll("button")).toHaveLength(1);
  });
});
