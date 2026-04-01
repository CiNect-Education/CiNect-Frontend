import { test, expect } from "playwright/test";

const EMAIL = process.env.E2E_EMAIL ?? "user@cinect.vn";
const PASSWORD = process.env.E2E_PASSWORD ?? "Password@123";

test("checkout creates booking and navigates to payment callback", async ({ page }) => {
  const consoleErrors: string[] = [];
  const failedResponses: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  page.on("pageerror", (err) => consoleErrors.push(String(err)));
  page.on("response", (res) => {
    const status = res.status();
    if (status >= 400 && failedResponses.length < 40) {
      failedResponses.push(`${status} ${res.request().method()} ${res.url()}`);
    }
  });

  // Login
  await page.goto("/en/login?returnTo=%2Fen%2Fmovies");
  await page.getByLabel(/email/i).fill(EMAIL);
  await page.getByLabel(/password/i).fill(PASSWORD);
  await page.getByRole("button", { name: /login/i }).click();
  await expect(page).not.toHaveURL(/\/en\/login/);

  // Go directly to a seeded showtime booking page (deterministic).
  const seeded = process.env.E2E_SHOWTIME_ID;
  test.skip(!seeded, "E2E_SHOWTIME_ID not provided");
  await page.goto(`/en/booking/${seeded}`);
  await expect(page.getByText(/Select Your Seats/i)).toBeVisible();

  // Select seat and hold
  await page.locator('button[aria-label^="Seat "][aria-label*="AVAILABLE"]:not([disabled])').first().click();
  await page.getByRole("button", { name: /^Continue$/ }).click();

  const proceedBtn = page.getByRole("button", { name: /Proceed/i });
  const errorBoundary = page.getByRole("heading", { name: /Something went wrong/i });
  try {
    await proceedBtn.waitFor({ state: "visible", timeout: 20_000 });
  } catch {
    if (await errorBoundary.isVisible().catch(() => false)) {
      throw new Error(
        `Error boundary shown.\n\nFailed responses:\n${failedResponses.join(
          "\n"
        )}\n\nConsole errors:\n${consoleErrors.join("\n")}`
      );
    }
    throw new Error(
      `Proceed button did not appear.\n\nFailed responses:\n${failedResponses.join(
        "\n"
      )}\n\nConsole errors:\n${consoleErrors.join("\n")}`
    );
  }

  await proceedBtn.click();
  await expect(page).toHaveURL(/\/en\/checkout\//);

  // Review → Snacks
  await page.getByRole("button", { name: /Continue to Snacks/i }).click();
  const continueToPayment = page.getByRole("button", { name: /Continue to Payment/i });
  try {
    await continueToPayment.waitFor({ state: "visible", timeout: 15_000 });
  } catch {
    if (await errorBoundary.isVisible().catch(() => false)) {
      throw new Error(
        `Error boundary shown.\n\nFailed responses:\n${failedResponses.join(
          "\n"
        )}\n\nConsole errors:\n${consoleErrors.join("\n")}`
      );
    }
    throw new Error(
      `Snacks step did not appear.\n\nFailed responses:\n${failedResponses.join(
        "\n"
      )}\n\nConsole errors:\n${consoleErrors.join("\n")}`
    );
  }

  // Skip snacks / continue (creates booking and moves to Payment)
  await page.getByRole("button", { name: /Skip/i }).click();
  await expect(page.getByRole("button", { name: /Complete Payment/i })).toBeVisible();

  // Complete payment (should navigate to callback or ticket).
  await page.getByRole("button", { name: /Complete Payment/i }).click();
  await expect(page).toHaveURL(/\/en\/(payment\/callback|tickets)\b/);

  const joined = consoleErrors.join("\n");
  expect(joined).not.toMatch(/Maximum update depth exceeded/i);
});

