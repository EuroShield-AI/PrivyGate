import * as cheerio from "cheerio";

export interface GDPRFinding {
  type: "cookie" | "form" | "tracking" | "privacy_policy" | "consent" | "data_collection";
  severity: "high" | "medium" | "low";
  description: string;
  location?: string;
  recommendation?: string;
}

export interface GDPRReport {
  url: string;
  findings: GDPRFinding[];
  score: number;
  hasPrivacyPolicy: boolean;
  hasCookieBanner: boolean;
  hasConsentMechanism: boolean;
  dataCollectionPoints: number;
}

export async function analyzeWebsite(url: string): Promise<GDPRReport> {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; PrivyGate GDPR Analyzer/1.0)",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    const findings: GDPRFinding[] = [];
    let score = 100;

    // Check for privacy policy
    const privacyPolicyLinks = $('a[href*="privacy"], a[href*="Privacy"], a:contains("Privacy Policy"), a:contains("privacy policy")');
    const hasPrivacyPolicy = privacyPolicyLinks.length > 0;
    if (!hasPrivacyPolicy) {
      findings.push({
        type: "privacy_policy",
        severity: "high",
        description: "No privacy policy link found",
        recommendation: "Add a clear privacy policy link in the footer or header",
      });
      score -= 20;
    }

    // Check for cookie banner/consent
    const cookieBanner = $('[class*="cookie"], [id*="cookie"], [class*="consent"], [id*="consent"]');
    const hasCookieBanner = cookieBanner.length > 0;
    if (!hasCookieBanner) {
      findings.push({
        type: "consent",
        severity: "high",
        description: "No cookie consent banner detected",
        recommendation: "Implement a GDPR-compliant cookie consent mechanism",
      });
      score -= 15;
    }

    // Check for tracking scripts
    const trackingScripts = $('script[src*="google-analytics"], script[src*="gtag"], script[src*="facebook"], script[src*="pixel"], script[src*="analytics"]');
    if (trackingScripts.length > 0) {
      findings.push({
        type: "tracking",
        severity: "medium",
        description: `Found ${trackingScripts.length} tracking script(s)`,
        recommendation: "Ensure tracking scripts are only loaded after user consent",
      });
      score -= 10;
    }

    // Check for forms collecting personal data
    const forms = $("form");
    let dataCollectionPoints = 0;
    forms.each((_, form) => {
      const formHtml = $(form).html() || "";
      const hasEmail = formHtml.includes("email") || formHtml.includes("Email");
      const hasPhone = formHtml.includes("phone") || formHtml.includes("Phone");
      const hasName = formHtml.includes("name") || formHtml.includes("Name");
      
      if (hasEmail || hasPhone || hasName) {
        dataCollectionPoints++;
        findings.push({
          type: "form",
          severity: "medium",
          description: "Form collecting personal data detected",
          location: $(form).attr("action") || "N/A",
          recommendation: "Ensure forms have clear data processing notices",
        });
      }
    });

    if (dataCollectionPoints > 0) {
      score -= 5 * Math.min(dataCollectionPoints, 5);
    }

    // Check for cookies in meta tags
    const cookieMeta = $('meta[name*="cookie"], meta[property*="cookie"]');
    if (cookieMeta.length === 0 && cookieBanner.length === 0) {
      findings.push({
        type: "cookie",
        severity: "low",
        description: "No cookie information found",
        recommendation: "Consider adding cookie information or a cookie policy",
      });
      score -= 5;
    }

    // Check for data minimization practices
    const unnecessaryFields = $('input[type="text"], input[type="email"]').filter((_, el) => {
      const placeholder = $(el).attr("placeholder")?.toLowerCase() || "";
      return placeholder.includes("optional") || placeholder.includes("not required");
    });

    if (unnecessaryFields.length > 5) {
      findings.push({
        type: "data_collection",
        severity: "low",
        description: "Multiple optional data collection fields detected",
        recommendation: "Review if all collected data is necessary (data minimization principle)",
      });
      score -= 5;
    }

    score = Math.max(0, score);

    return {
      url,
      findings,
      score,
      hasPrivacyPolicy,
      hasCookieBanner: hasCookieBanner.length > 0,
      hasConsentMechanism: hasCookieBanner.length > 0,
      dataCollectionPoints,
    };
  } catch (error) {
    throw new Error(`Failed to analyze website: ${error}`);
  }
}
