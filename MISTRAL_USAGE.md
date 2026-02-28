# Mistral AI Usage & Token Calculation

## Token Calculation

**How tokens are calculated:**
1. **Direct from Mistral API**: Token counts come directly from Mistral API responses via `response.usage.totalTokens`
2. **Stored in audit logs**: After each AI processing call, token usage is stored in the `auditLogs` table with event type `PROCESSING_COMPLETED`
3. **Aggregated on query**: The `/api/settings/usage` endpoint queries all `PROCESSING_COMPLETED` audit logs for the user's jobs and sums up `totalTokens` from metadata

**Current Implementation:**
- ✅ Token tracking in `/api/process` (summarize, classify, extract-actions)
- ❌ Token tracking missing in AI PII detection (`lib/ai-detector.ts`)
- ❌ Token tracking missing in GDPR analyzer (`lib/gdpr-analyzer.ts`)

**Token Limit:**
- Currently hardcoded to 1,000,000 tokens (can be made configurable per user/plan)

## Models Used

**Current Model: `mistral-large-latest`**
- Used in all AI operations:
  - Text processing (summarize, classify, extract-actions)
  - PII detection
  - GDPR analysis

**Model Variants Available:**
- `mistral-tiny` - Fastest, smallest (used only for API key testing)
- `mistral-small-latest` - Balanced performance
- `mistral-medium-latest` - Better quality
- `mistral-large-latest` - Best quality (currently used)
- `pixtral-large-latest` - Multimodal (image + text) - **NEW**
- `open-mistral-7b` - Open source variant
- `open-mixtral-8x7b` - Open source variant

## Available Mistral AI Features (Not Currently Used)

1. **Embeddings API** (`mistral.embeddings.create`)
   - Could replace/enhance ChromaDB vector search
   - Better semantic search for large documents
   - Model: `mistral-embed`

2. **Function Calling / Tool Use**
   - Structured outputs with function definitions
   - Could enhance GDPR analysis with structured compliance checks

3. **Streaming Responses** (`stream: true`)
   - Real-time token streaming for better UX
   - Progressive display of results

4. **Batch Processing**
   - Process multiple requests efficiently
   - Lower costs for bulk operations

5. **Fine-tuning API**
   - Custom models for specific use cases
   - Better PII detection accuracy

6. **Vision Models** (`pixtral-large-latest`)
   - Analyze screenshots/images for GDPR compliance
   - OCR and document analysis

## Recommendations

1. **Add token tracking** to AI detection and GDPR analyzer calls
2. **Consider using `pixtral-large-latest`** for multimodal capabilities (if needed)
3. **Implement Mistral embeddings** for better vector search
4. **Add streaming** for long-running operations
5. **Make token limit configurable** per user/plan
