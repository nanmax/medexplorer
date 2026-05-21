import { test, expect } from "@playwright/test";

test.describe("MedExplorer — Windows Explorer-like UX", () => {
  test("loads with left tree populated and empty right panel", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("tree")).toBeVisible();
    await expect(page.getByText("MRI Scans")).toBeVisible();
    await expect(page.getByText("Select a folder")).toBeVisible();
  });

  test("clicking a folder shows its sub-folders + files on the right panel", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("treeitem", { name: /MRI Scans/ }).click();

    // Right panel header
    await expect(page.getByText("Name", { exact: true })).toBeVisible();
    await expect(page.getByText("Type", { exact: true })).toBeVisible();
    await expect(page.getByText("Size", { exact: true })).toBeVisible();
    await expect(page.getByText("Date Modified", { exact: true })).toBeVisible();

    // Sub-folders of MRI Scans seeded earlier
    await expect(page.getByText("Patient_Doe")).toBeVisible();
  });

  test("expand/collapse a folder in the tree (lazy load children)", async ({ page }) => {
    await page.goto("/");
    const expandBtn = page.getByRole("button", { name: /Expand MRI Scans/ });
    await expandBtn.click();
    await expect(page.getByRole("button", { name: /Collapse MRI Scans/ })).toBeVisible();
    // Nested treeitem visible after expansion
    await expect(page.getByRole("treeitem", { name: /Patient_Doe/ })).toBeVisible();
  });

  test("breadcrumb updates after navigating into a sub-folder", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("treeitem", { name: /MRI Scans/ }).click();
    await page.getByText("Patient_Doe", { exact: true }).first().click();
    const breadcrumb = page.getByRole("navigation", { name: "Breadcrumb" });
    await expect(breadcrumb.getByText("MRI Scans")).toBeVisible();
    await expect(breadcrumb.getByText("Patient_Doe")).toBeVisible();
  });

  test("search returns folder hits", async ({ page }) => {
    await page.goto("/");
    await page.getByPlaceholder("Search folders & files...").fill("mri");
    await expect(page.getByRole("listbox", { name: "Search results" })).toBeVisible();
    await expect(page.getByRole("option").first()).toContainText(/MRI|Patient/i);
  });
});
