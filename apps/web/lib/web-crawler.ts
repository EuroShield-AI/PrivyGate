import puppeteer from "puppeteer";

export interface CrawlResult {
  html: string;
  text: string;
  scripts: string;
  cookies: string[];
  loaded: boolean;
}

export async function crawlWebsite(url: string, waitForSPA: boolean = true): Promise<CrawlResult> {
  let browser;
  
  try {
    // Launch headless browser
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
      ],
    });

    const page = await browser.newPage();
    
    // Set viewport and user agent
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    );

    // Navigate to page
    await page.goto(url, {
      waitUntil: waitForSPA ? "networkidle2" : "domcontentloaded",
      timeout: 30000,
    });

    // Wait for common SPA frameworks to load
    if (waitForSPA) {
      try {
        // Wait for React, Vue, Angular, or other frameworks
        await page.waitForFunction(
          () => {
            return (
              window.document.readyState === "complete" &&
              (window as any).React !== undefined ||
              (window as any).Vue !== undefined ||
              (window as any).angular !== undefined ||
              document.querySelectorAll('[data-reactroot], [ng-app], [x-data]').length > 0
            );
          },
          { timeout: 5000 }
        ).catch(() => {
          // Framework detection failed, just wait a bit more
        });

        // Additional wait for dynamic content
        await page.waitForTimeout(2000);
      } catch (e) {
        // Continue if framework detection fails
      }
    }

    // Get cookies
    const cookies = await page.cookies();
    const cookieNames = cookies.map(c => c.name);

    // Extract HTML and text
    const html = await page.content();
    const text = await page.evaluate(() => {
      return document.body.innerText || document.body.textContent || "";
    });

    // Extract script content
    const scripts = await page.evaluate(() => {
      const scriptElements = Array.from(document.querySelectorAll("script"));
      return scriptElements
        .map(script => script.innerHTML || script.textContent || "")
        .join(" ");
    });

    return {
      html,
      text,
      scripts,
      cookies: cookieNames,
      loaded: true,
    };
  } catch (error) {
    console.error("Puppeteer crawl error:", error);
    // Fallback to basic fetch
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
