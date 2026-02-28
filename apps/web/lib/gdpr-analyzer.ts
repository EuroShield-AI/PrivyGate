import * as cheerio from "cheerio";
import { Mistral } from "@mistralai/mistralai";

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
    onStatusUpdate?.("Fetching website content...");
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; PrivyGate GDPR Analyzer/1.0)",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
    }

    onStatusUpdate?.("Parsing HTML content...");
    const html = await response.text();
    const $ = cheerio.load(html);
    const findings: GDPRFinding[] = [];
    let score = 100;
    
    // Extract text content for AI analysis
    const pageText = $("body").text().substring(0, 10000); // Limit to 10k chars

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

    let aiSummary: string | undefined;
    let aiAnalysis: Record<string, string> = {};

    // Use Mistral AI for comprehensive analysis if API key is provided
    if (mistralApiKey && pageText) {
      try {
        onStatusUpdate?.("Analyzing with AI...");
        const { Mistral } = await import("@mistralai/mistralai");
        const mistral = new Mistral({ apiKey: mistralApiKey });
        
        // First, use AI to detect PII and personal data in the website content
        onStatusUpdate?.("Detecting personal data with AI...");
        const piiDetectionPrompt = `Analyze the following website content and identify all instances of personal data collection, processing, or storage mentioned.

Website URL: ${url}
Content: ${pageText.substring(0, 15000)}

Return JSON with:
{
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
        
        // Add findings based on AI PII detection
        if (piiData.personalDataFound && piiData.personalDataFound.length > 0) {
          findings.push({
            type: "data_collection",
            severity: "high",
            description: `AI detected personal data types: ${piiData.personalDataFound.join(", ")}`,
            recommendation: "Ensure all personal data collection is disclosed in privacy policy",
            aiAnalysis: `Processing activities: ${piiData.dataProcessingActivities?.join(", ") || "Not specified"}`,
          });
        }

        if (piiData.thirdPartySharing && piiData.thirdPartySharing.length > 0) {
          findings.push({
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
            findings.push({
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
          findings.push({
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

    return {
      url,
      findings,
      score,
      hasPrivacyPolicy,
      hasCookieBanner: hasCookieBanner.length > 0,
      hasConsentMechanism: hasCookieBanner.length > 0,
      dataCollectionPoints,
      aiSummary,
    };
  } catch (error) {
    throw new Error(`Failed to analyze website: ${error}`);
  }
}
