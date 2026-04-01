import { test, expect } from "playwright/test";

const EMAIL = process.env.E2E_EMAIL ?? "user@cinect.vn";
const PASSWORD = process.env.E2E_PASSWORD ?? "Password@123";

test("payment callback redirects to ticket page", async ({ page }) => {
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

  const seeded = process.env.E2E_SHOWTIME_ID;
  test.skip(!seeded, "E2E_SHOWTIME_ID not provided");

  // Booking → hold → checkout
  await page.goto(`/en/booking/${seeded}`);

  const errorBoundary = page.getByRole("heading", { name: /Something went wrong/i });
  if (await errorBoundary.isVisible().catch(() => false)) {
    throw new Error(
      `Error boundary shown.\n\nFailed responses:\n${failedResponses.join(
        "\n"
      )}\n\nConsole errors:\n${consoleErrors.join("\n")}`
    );
  }

  await expect(page.getByRole("button", { name: /Zoom in/i })).toBeVisible({ timeout: 20_000 });
  await page.getByRole("button", { name: /Choose Best Seats/i }).click();
  await page.getByRole("button", { name: /^Continue$/ }).click();
  await page.getByRole("button", { name: /Proceed/i }).waitFor({ state: "visible", timeout: 20_000 });
  await page.getByRole("button", { name: /Proceed/i }).click();
  await expect(page).toHaveURL(/\/en\/checkout\//);

  // Review → Snacks → Payment
  await page.getByRole("button", { name: /Continue to Snacks/i }).click();
  await page.getByRole("button", { name: /Skip/i }).click();
  await page.getByRole("button", { name: /Complete Payment/i }).click();

  // Should land on payment callback first, then auto-redirect to tickets.
  await expect(page).toHaveURL(/\/en\/payment\/callback/);
  try {
    await expect(page).toHaveURL(/\/en\/tickets\//, { timeout: 20_000 });
  } catch {
    if (await errorBoundary.isVisible().catch(() => false)) {
      throw new Error(
        `Error boundary shown.\n\nFailed responses:\n${failedResponses.join(
          "\n"
        )}\n\nConsole errors:\n${consoleErrors.join("\n")}`
      );
    }
    throw new Error(
      `Did not redirect to tickets.\n\nFailed responses:\n${failedResponses.join(
        "\n"
      )}\n\nConsole errors:\n${consoleErrors.join("\n")}`
    );
  }

  // Ticket page should render QR canvas/svg.
  if (await errorBoundary.isVisible().catch(() => false)) {
    throw new Error(
      `Error boundary shown on tickets.\n\nFailed responses:\n${failedResponses.join(
        "\n"
      )}\n\nConsole errors:\n${consoleErrors.join("\n")}`
    );
  }

  await expect(page.getByText(/Your Ticket/i)).toBeVisible();
  await expect(page.locator("svg").first()).toBeVisible();
});

