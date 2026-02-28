import * as cheerio from "cheerio";
import { crawlWebsite } from "./web-crawler";

export interface GDPRFinding {
  type: "cookie" | "form" | "tracking" | "privacy_policy" | "consent" | "data_collection";
  severity: "high" | "medium" | "low";
  description: string;
  location?: string;
  recommendation?: string;
  aiAnalysis?: string;
}

export interface GDPRReport {
  url: string;
  findings: GDPRFinding[];
  score: number;
  hasPrivacyPolicy: boolean;
  hasCookieBanner: boolean;
  hasConsentMechanism: boolean;
  dataCollectionPoints: number;
  aiSummary?: string;
  scanningStatus?: string;
}

export async function analyzeWebsite(
  url: string,
  mistralApiKey?: string,
  onStatusUpdate?: (status: string) => void
): Promise<GDPRReport> {
  try {
    onStatusUpdate?.("Loading website (waiting for SPA content to load)...");
    
    let html: string;
    let pageText: string;
    let scriptContent: string;
    let allText: string;
    let detectedCookies: string[] = [];
    
    // Try using Puppeteer for SPA support, fallback to fetch
    try {
      const crawlResult = await crawlWebsite(url, true);
      html = crawlResult.html;
      pageText = crawlResult.text;
      scriptContent = crawlResult.scripts;
      allText = pageText + " " + scriptContent;
      detectedCookies = crawlResult.cookies;
      onStatusUpdate?.("Website loaded, analyzing content...");
    } catch (puppeteerError) {
      console.warn("Puppeteer failed, falling back to fetch:", puppeteerError);
      onStatusUpdate?.("Fetching website content (basic mode)...");
      
      // Fallback to basic fetch
      const response = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
          "Connection": "keep-alive",
        },
        redirect: "follow",
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
      }

      html = await response.text();
      const $ = cheerio.load(html);
      pageText = $("body").text();
      scriptContent = $("script").map((_, el) => $(el).html() || "").get().join(" ");
      allText = pageText + " " + scriptContent;
    }

    onStatusUpdate?.("Parsing HTML content...");
    const $ = cheerio.load(html);
    const findings: GDPRFinding[] = [];
    const findingsSet = new Set<string>(); // For deduplication
    let score = 100;
    
    // Helper to add finding with deduplication
    const addFinding = (finding: GDPRFinding) => {
      const key = `${finding.type}-${finding.description}`;
      if (!findingsSet.has(key)) {
        findingsSet.add(key);
        findings.push(finding);
      }
    };

    // Check for privacy policy - more comprehensive search
    const privacyPolicyPatterns = [
      'a[href*="privacy"]',
      'a[href*="Privacy"]',
      'a:contains("Privacy Policy")',
      'a:contains("privacy policy")',
      'a:contains("Privacy Notice")',
      'a:contains("Data Protection")',
      '[class*="privacy"]',
      '[id*="privacy"]',
    ];
    let privacyPolicyFound = false;
    for (const pattern of privacyPolicyPatterns) {
      try {
        const matches = $(pattern);
        if (matches.length > 0) {
          privacyPolicyFound = true;
          break;
        }
      } catch (e) {
        // Some selectors might fail, continue
      }
    }
    
    // Also check in text content
    const privacyPolicyText = /privacy\s+policy|privacy\s+notice|data\s+protection/i;
    if (!privacyPolicyFound && privacyPolicyText.test(allText)) {
      privacyPolicyFound = true;
    }
    
    const hasPrivacyPolicy = privacyPolicyFound;
    if (!hasPrivacyPolicy) {
      addFinding({
        type: "privacy_policy",
        severity: "high",
        description: "No privacy policy link found",
        recommendation: "Add a clear privacy policy link in the footer or header",
      });
      score -= 20;
    }

    // Comprehensive cookie detection
    onStatusUpdate?.("Detecting cookies and consent mechanisms...");
    
    // Check for actual cookies detected by browser
    const hasActualCookies = detectedCookies.length > 0;
    
    // Check for cookie-related elements in HTML
    const cookieSelectors = [
      '[class*="cookie"]',
      '[id*="cookie"]',
      '[class*="Cookie"]',
      '[id*="Cookie"]',
      '[class*="consent"]',
      '[id*="consent"]',
      '[class*="Consent"]',
      '[id*="Consent"]',
      '[class*="gdpr"]',
      '[id*="gdpr"]',
      '[class*="GDPR"]',
      '[id*="GDPR"]',
      '[data-cookie]',
      '[data-consent]',
      '[data-gdpr]',
    ];
    
    let cookieElements: any[] = [];
    cookieSelectors.forEach(selector => {
      try {
        const elements = $(selector);
        elements.each((_, el) => {
          cookieElements.push($(el));
        });
      } catch (e) {
        // Continue if selector fails
      }
    });
    
    // Check for cookie-related text in content (more comprehensive)
    const cookieTextPatterns = [
      /cookie\s+policy/i,
      /cookie\s+consent/i,
      /cookie\s+banner/i,
      /accept\s+cookies/i,
      /manage\s+cookies/i,
      /cookie\s+settings/i,
      /gdpr\s+consent/i,
      /privacy\s+preferences/i,
      /cookie\s+notice/i,
      /cookie\s+popup/i,
      /cookie\s+dialog/i,
      /cookie\s+preferences/i,
    ];
    
    let cookieTextFound = false;
    let cookieTextMatches: string[] = [];
    for (const pattern of cookieTextPatterns) {
      const matches = allText.match(pattern);
      if (matches) {
        cookieTextFound = true;
        cookieTextMatches.push(...matches);
      }
    }
    
    // Check for cookie-related scripts
    const cookieScripts = $('script').filter((_, el) => {
      const scriptContent = $(el).html() || "";
      return /cookie|consent|gdpr/i.test(scriptContent);
    });
    
    // Check for cookie-related meta tags
    const cookieMeta = $('meta[name*="cookie"], meta[property*="cookie"], meta[name*="Cookie"], meta[property*="Cookie"]');
    
    // Check for localStorage/sessionStorage cookie usage in scripts
    const storageCookieUsage = /(localStorage|sessionStorage).*cookie|document\.cookie/i.test(scriptContent);
    
    // Check for cookie consent libraries
    const cookieLibraries = [
      /cookiebot|Cookiebot/i,
      /onetrust|OneTrust/i,
      /cookieconsent|CookieConsent/i,
      /cookie-law-info/i,
      /gdpr-cookie/i,
    ];
    
    let cookieLibraryFound = false;
    for (const pattern of cookieLibraries) {
      if (pattern.test(allText) || pattern.test(scriptContent)) {
        cookieLibraryFound = true;
        break;
      }
    }
    
    const hasCookieBanner = hasActualCookies || cookieElements.length > 0 || cookieTextFound || cookieScripts.length > 0 || cookieMeta.length > 0 || storageCookieUsage || cookieLibraryFound;
    
    // If cookies are detected but no banner, that's a problem
    if (hasActualCookies && !cookieTextFound && cookieElements.length === 0 && !cookieLibraryFound) {
      addFinding({
        type: "cookie",
        severity: "high",
        description: `Cookies detected (${detectedCookies.length} cookies) but no cookie consent banner found`,
        recommendation: "Implement a cookie consent banner before setting any cookies",
      });
      score -= 20;
    }
    
    if (!hasCookieBanner) {
      addFinding({
        type: "consent",
        severity: "high",
        description: "No cookie consent banner or mechanism detected",
        recommendation: "Implement a GDPR-compliant cookie consent mechanism",
      });
      score -= 15;
    } else {
      // Check if it's actually functional (has accept/decline buttons)
      const hasAcceptButton = /accept|agree|allow|consent/i.test(allText) && 
                             (/button|click|submit/i.test(allText) || cookieElements.some(el => el.find('button').length > 0));
      if (!hasAcceptButton) {
        addFinding({
          type: "consent",
          severity: "medium",
          description: "Cookie banner detected but may lack proper consent mechanism",
          recommendation: "Ensure cookie banner has clear accept/decline options",
        });
        score -= 5;
      }
    }

    // Check for tracking scripts - comprehensive detection
    const trackingPatterns = [
      'script[src*="google-analytics"]',
      'script[src*="gtag"]',
      'script[src*="ga.js"]',
      'script[src*="analytics"]',
      'script[src*="facebook"]',
      'script[src*="pixel"]',
      'script[src*="doubleclick"]',
      'script[src*="advertising"]',
      'script[src*="tagmanager"]',
      'script[src*="hotjar"]',
      'script[src*="mixpanel"]',
      'script[src*="segment"]',
    ];
    
    const trackingScripts: any[] = [];
    trackingPatterns.forEach(pattern => {
      try {
        const scripts = $(pattern);
        scripts.each((_, el) => {
          trackingScripts.push($(el));
        });
      } catch (e) {
        // Continue
      }
    });
    
    // Also check script content for tracking code
    $('script').each((_, el) => {
      const content = $(el).html() || "";
      if (/google.*analytics|gtag|ga\(|_gaq|fbq|mixpanel|segment/i.test(content)) {
        trackingScripts.push($(el));
      }
    });
    
    if (trackingScripts.length > 0) {
      addFinding({
        type: "tracking",
        severity: "medium",
        description: `Found ${trackingScripts.length} tracking script(s) or analytics code`,
        recommendation: "Ensure tracking scripts are only loaded after user consent",
      });
      score -= 10;
    }

    // Check for forms collecting personal data
    const forms = $("form");
    let dataCollectionPoints = 0;
    const formLocations = new Set<string>();
    
    forms.each((_, form) => {
      const formEl = $(form);
      const formHtml = formEl.html() || "";
      const formAction = formEl.attr("action") || "N/A";
      
      // More comprehensive form field detection
      const hasEmail = /email|e-mail|mail/i.test(formHtml) || 
                      formEl.find('input[type="email"]').length > 0 ||
                      formEl.find('input[name*="email"]').length > 0;
      const hasPhone = /phone|mobile|tel/i.test(formHtml) ||
                      formEl.find('input[type="tel"]').length > 0 ||
                      formEl.find('input[name*="phone"]').length > 0;
      const hasName = /name|firstname|lastname|fullname/i.test(formHtml) ||
                     formEl.find('input[name*="name"]').length > 0;
      const hasAddress = /address|street|city|zip|postal/i.test(formHtml);
      const hasDateOfBirth = /dob|date.*birth|birthday/i.test(formHtml);
      
      if (hasEmail || hasPhone || hasName || hasAddress || hasDateOfBirth) {
        if (!formLocations.has(formAction)) {
          formLocations.add(formAction);
          dataCollectionPoints++;
          addFinding({
            type: "form",
            severity: "medium",
            description: `Form collecting personal data detected${hasEmail ? " (email)" : ""}${hasPhone ? " (phone)" : ""}${hasName ? " (name)" : ""}${hasAddress ? " (address)" : ""}`,
            location: formAction,
            recommendation: "Ensure forms have clear data processing notices and consent checkboxes",
          });
        }
      }
    });

    if (dataCollectionPoints > 0) {
      score -= 5 * Math.min(dataCollectionPoints, 5);
    }

    // Check for cookie policy link
    const cookiePolicyLinks = $('a[href*="cookie"], a:contains("Cookie Policy"), a:contains("cookie policy")');
    if (cookiePolicyLinks.length === 0 && !hasCookieBanner) {
      // Only add if we haven't already flagged missing cookie banner
      if (!findingsSet.has("consent-No cookie consent banner or mechanism detected")) {
        addFinding({
          type: "cookie",
          severity: "low",
          description: "No cookie policy link found",
          recommendation: "Consider adding a cookie policy page or link",
        });
        score -= 5;
      }
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

    let aiSummary: string | undefined;
    let aiAnalysis: Record<string, string> = {};

    // Use Mistral AI for comprehensive analysis if API key is provided
    if (mistralApiKey && pageText) {
      try {
        onStatusUpdate?.("Analyzing with AI...");
        const { Mistral } = await import("@mistralai/mistralai");
        const mistral = new Mistral({ apiKey: mistralApiKey });
        
        // First, use AI to detect cookies, PII and personal data in the website content
        onStatusUpdate?.("Detecting cookies and personal data with AI...");
        const piiDetectionPrompt = `Analyze the following website HTML and content to identify:
1. Cookie usage and cookie policies
2. Personal data collection, processing, or storage
3. Cookie consent mechanisms

Website URL: ${url}
Detected Cookies: ${detectedCookies.join(", ") || "None detected by browser"}
HTML Content (first 25k chars): ${html.substring(0, 25000)}
Text Content (first 20k chars): ${allText.substring(0, 20000)}
Script Content (first 10k chars): ${scriptContent.substring(0, 10000)}

Return JSON with:
{
  "cookiesDetected": ["list of cookies mentioned, used, or set"],
  "cookiePolicy": "yes|no|partial",
  "cookieConsent": "yes|no|partial",
  "cookieBannerPresent": "yes|no|partial",
  "personalDataFound": ["list of specific personal data types mentioned"],
  "dataProcessingActivities": ["list of data processing activities"],
  "thirdPartySharing": ["any third parties mentioned for data sharing"],
  "userRights": ["GDPR rights mentioned (access, deletion, portability, etc.)"],
  "retentionPeriods": ["any data retention periods mentioned"]
}`;

        const piiResponse = await mistral.chat.complete({
          model: "mistral-large-latest",
          messages: [{ role: "user", content: piiDetectionPrompt }],
          responseFormat: { type: "json_object" },
          temperature: 0.2,
        });

        const piiData = JSON.parse(piiResponse.choices[0]?.message?.content || "{}");
        
        // Add findings based on AI cookie detection
        if (piiData.cookiesDetected && piiData.cookiesDetected.length > 0) {
          const cookieDescription = `AI detected ${piiData.cookiesDetected.length} cookie(s): ${piiData.cookiesDetected.slice(0, 5).join(", ")}${piiData.cookiesDetected.length > 5 ? "..." : ""}`;
          
          if (piiData.cookieConsent === "no") {
            addFinding({
              type: "cookie",
              severity: "high",
              description: `${cookieDescription}. Cookie consent mechanism: Not found`,
              recommendation: "Implement proper cookie consent mechanism before setting cookies",
              aiAnalysis: `Cookie policy: ${piiData.cookiePolicy || "Not found"}, Cookie banner: ${piiData.cookieBannerPresent || "Not found"}`,
            });
          } else if (piiData.cookieConsent === "partial") {
            addFinding({
              type: "cookie",
              severity: "medium",
              description: `${cookieDescription}. Cookie consent mechanism: Partial/incomplete`,
              recommendation: "Ensure cookie consent mechanism covers all cookie types and has clear accept/decline options",
              aiAnalysis: `Cookie policy: ${piiData.cookiePolicy || "Not found"}`,
            });
          }
        } else if (hasActualCookies && piiData.cookieConsent === "no") {
          // Browser detected cookies but AI didn't find consent
          addFinding({
            type: "cookie",
            severity: "high",
            description: `Browser detected ${detectedCookies.length} cookie(s) but no consent mechanism found`,
            recommendation: "Implement cookie consent banner before setting cookies",
            aiAnalysis: "AI analysis confirms missing cookie consent",
          });
        }
        
        // Add findings based on AI PII detection
        if (piiData.personalDataFound && piiData.personalDataFound.length > 0) {
          addFinding({
            type: "data_collection",
            severity: "high",
            description: `AI detected personal data types: ${piiData.personalDataFound.join(", ")}`,
            recommendation: "Ensure all personal data collection is disclosed in privacy policy",
            aiAnalysis: `Processing activities: ${piiData.dataProcessingActivities?.join(", ") || "Not specified"}`,
          });
        }

        if (piiData.thirdPartySharing && piiData.thirdPartySharing.length > 0) {
          addFinding({
            type: "data_collection",
            severity: "medium",
            description: `Third-party data sharing detected: ${piiData.thirdPartySharing.join(", ")}`,
            recommendation: "Ensure third-party sharing is clearly disclosed and consent obtained",
            aiAnalysis: "AI-detected third-party sharing",
          });
        }

        // Comprehensive GDPR compliance analysis
        onStatusUpdate?.("Performing comprehensive GDPR analysis...");
        const compliancePrompt = `Perform a comprehensive GDPR compliance analysis for this website.

Website URL: ${url}

Current automated findings:
- Privacy Policy: ${hasPrivacyPolicy ? "Found" : "Missing"}
- Cookie Banner: ${hasCookieBanner.length > 0 ? "Found" : "Missing"}
- Data Collection Points: ${dataCollectionPoints}
- Compliance Score: ${score}/100

Detected Personal Data: ${piiData.personalDataFound?.join(", ") || "None detected"}
Data Processing: ${piiData.dataProcessingActivities?.join(", ") || "Not specified"}
Third-Party Sharing: ${piiData.thirdPartySharing?.join(", ") || "None detected"}
User Rights Mentioned: ${piiData.userRights?.join(", ") || "Not specified"}

Website content (first 15k chars):
${pageText.substring(0, 15000)}

Provide a comprehensive GDPR compliance analysis:
1. Overall compliance assessment (2-3 sentences)
2. Specific recommendations for each GDPR requirement
3. Missing GDPR elements
4. Risk assessment
5. Priority actions

Format as JSON:
{
  "summary": "...",
  "complianceScore": 0-100,
  "recommendations": {
    "privacy_policy": "...",
    "consent": "...",
    "data_collection": "...",
    "user_rights": "...",
    "data_retention": "...",
    "security": "..."
  },
  "missingElements": ["list of missing GDPR elements"],
  "riskLevel": "low|medium|high",
  "priorityActions": ["list of priority actions"]
}`;

        const complianceResponse = await mistral.chat.complete({
          model: "mistral-large-latest",
          messages: [{ role: "user", content: compliancePrompt }],
          responseFormat: { type: "json_object" },
          temperature: 0.2,
        });

        const aiResponse = JSON.parse(complianceResponse.choices[0]?.message?.content || "{}");
        aiSummary = aiResponse.summary;
        
        // Update score based on AI assessment if provided
        if (aiResponse.complianceScore !== undefined) {
          score = Math.round((score + aiResponse.complianceScore) / 2); // Average with automated score
        }
        
        // Enhance existing findings with AI recommendations
        findings.forEach((finding) => {
          const recKey = finding.type === "privacy_policy" ? "privacy_policy" :
                        finding.type === "consent" ? "consent" :
                        finding.type === "data_collection" ? "data_collection" : null;
          if (recKey && aiResponse.recommendations?.[recKey]) {
            finding.aiAnalysis = aiResponse.recommendations[recKey];
          }
        });

        // Add missing elements as findings
        if (aiResponse.missingElements && aiResponse.missingElements.length > 0) {
          aiResponse.missingElements.forEach((element: string) => {
            addFinding({
              type: "data_collection",
              severity: aiResponse.riskLevel === "high" ? "high" : "medium",
              description: `Missing GDPR element: ${element}`,
              recommendation: aiResponse.recommendations?.[element.toLowerCase().replace(/\s+/g, "_")] || "Address this missing element",
              aiAnalysis: "AI-detected missing GDPR requirement",
            });
          });
        }

        // Add priority actions
        if (aiResponse.priorityActions && aiResponse.priorityActions.length > 0) {
          addFinding({
            type: "data_collection",
            severity: "high",
            description: `Priority actions: ${aiResponse.priorityActions.join("; ")}`,
            recommendation: "Address these priority actions to improve GDPR compliance",
            aiAnalysis: `Risk level: ${aiResponse.riskLevel || "medium"}`,
          });
        }
      } catch (error) {
        console.error("Mistral AI analysis error:", error);
        // Continue without AI analysis
      }
    }

    onStatusUpdate?.("Analysis complete");

    // Final deduplication pass - remove any remaining duplicates
    const finalFindings: GDPRFinding[] = [];
    const finalSet = new Set<string>();
    
    findings.forEach(finding => {
      const key = `${finding.type}-${finding.description.substring(0, 100)}`;
      if (!finalSet.has(key)) {
        finalSet.add(key);
        finalFindings.push(finding);
      }
    });

    return {
      url,
      findings: finalFindings,
      score,
      hasPrivacyPolicy,
      hasCookieBanner: hasCookieBanner,
      hasConsentMechanism: hasCookieBanner,
      dataCollectionPoints,
      aiSummary,
    };
  } catch (error) {
    throw new Error(`Failed to analyze website: ${error}`);
  }
}
