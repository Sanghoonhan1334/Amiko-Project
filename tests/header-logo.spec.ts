import { test, expect } from "@playwright/test";

test.describe("Header Logo Visibility", () => {
  test("light mode shows dark logo", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "light" });
    await page.goto("http://localhost:3000/");
    
    const logo = page.locator('img[alt="Amiko"]').first();
    await expect(logo).toBeVisible();
    
    // 라이트 모드에서는 검은 로고가 보여야 함
    const logoSrc = await logo.getAttribute('src');
    expect(logoSrc).toContain('amiko-logo.png');
  });

  test("dark mode shows light logo", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await page.goto("http://localhost:3000/");
    
    const logo = page.locator('img[alt="Amiko"]').first();
    await expect(logo).toBeVisible();
    
    // 다크 모드에서는 흰 로고가 보여야 함
    const logoSrc = await logo.getAttribute('src');
    expect(logoSrc).toContain('amiko-logo-dark.png');
  });

  test("logo is clickable and navigates to home", async ({ page }) => {
    await page.goto("http://localhost:3000/main");
    
    const logo = page.locator('img[alt="Amiko"]').first();
    await logo.click();
    
    // 홈페이지로 이동했는지 확인
    await expect(page).toHaveURL("http://localhost:3000/");
  });
});
