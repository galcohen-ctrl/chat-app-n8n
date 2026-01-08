# n8n Configuration Fix

## Problem
You're getting these errors:
1. **n8n**: "Invalid JSON in 'Response Body' field"
2. **Next.js**: "SyntaxError: Unexpected end of JSON input"

## Root Cause
The JSON in your "Respond to Webhook" node has unescaped quotes and special characters in the response text, which breaks the JSON structure.

---

## Solution 1: Use Code Node (Recommended)

Instead of manually writing JSON in the "Respond to Webhook" node, use a **Code** node before it to properly construct the JSON.

### Step 1: Add a Code Node
Add a **Code** node between your AI processing and the "Respond to Webhook" node.

### Step 2: Code Node Configuration
Set the language to **JavaScript** and use this code:

```javascript
// Get the session_id from the webhook input
const sessionId = $input.first().json.body.session_id;

// Get the AI response from the previous node
// Replace 'yourAiNodeFieldName' with the actual field containing the response
const aiResponse = $input.first().json.output || $input.first().json.text || $input.first().json.answer;

// Return properly escaped JSON
return [
  {
    json: {
      session_id: sessionId,
      response: aiResponse
    }
  }
];
```

### Step 3: Update Respond to Webhook Node
In the "Respond to Webhook" node:
- **Respond With**: JSON
- **Response Body**:
```
{{ $json }}
```

This will automatically serialize the object from the Code node into valid JSON.

---

## Solution 2: Using Expressions (Alternative)

If you prefer not to use a Code node, you can use n8n expressions:

### In the "Respond to Webhook" node:

**Response Body**:
```
{
  "session_id": "{{ $('Webhook').item.json.body.session_id }}",
  "response": {{ $json.output.toJsonString() }}
}
```

The `.toJsonString()` method will properly escape quotes and special characters.

---

## Solution 3: Simple Response Format

If the above solutions don't work, try the simplest possible format:

### Webhook Node Settings:
- Set **Respond**: "When Last Node Finishes"
- **Response Mode**: "Last Node"

### Respond to Webhook Node:
- **Respond With**: JSON
- Use the **VISUAL EDITOR** instead of writing raw JSON
- Click "Add Field" and add:
  - **Field Name**: `session_id`
  - **Field Value**: `={{ $('Webhook').item.json.body.session_id }}`
  - **Field Name**: `response`
  - **Field Value**: `={{ $json.output }}` (replace `.output` with your field)

---

## Important: Webhook Node Configuration

Make sure your **Webhook** (trigger) node is configured as:
- **HTTP Method**: POST
- **Path**: webhook-test/126dc567-f5d0-4a3d-a17b-40593448d57a
- **Response Mode**: ⚠️ **"When Last Node Finishes"** (NOT "Respond Immediately")
- **Response Code**: 200

---

## Testing in n8n

1. **Execute your workflow** once with test data
2. Check the output of each node
3. Look for the field containing your AI response (might be called `output`, `text`, `answer`, `message`, etc.)
4. Use that exact field name in your configuration

---

## Quick Checklist

- [ ] Webhook node set to "When Last Node Finishes"
- [ ] AI node successfully returns response
- [ ] Code node properly constructs JSON (or use visual editor)
- [ ] Respond to Webhook uses `{{ $json }}` or visual fields
- [ ] Test the workflow and check for valid JSON output
- [ ] Next.js app can now parse the response

---

## Example Working Setup

### Workflow Structure:
```
Webhook (POST)
  → AI Agent/ChatGPT/OpenAI
  → Code Node (format response)
  → Respond to Webhook
```

### Code Node Example:
```javascript
return [{
  json: {
    session_id: $('Webhook').item.json.body.session_id,
    response: $('AI Agent').item.json.output
  }
}];
```

### Respond to Webhook:
- Response Body: `{{ $json }}`

This guarantees valid JSON output! ✅
