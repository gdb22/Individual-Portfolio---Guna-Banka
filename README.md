# Individual Portfolio

## Name - Guna Banka

## Deployment Link - https://gdb22.github.io/Individual-Portfolio---Guna-Banka/
## LinkedIn Profile - https://www.linkedin.com/in/guna-banka-785179269/

## AI Feedback Setup

This portfolio now supports a real AI-backed feedback flow for:
- Resume feedback
- Job description translation
- Cover letter feedback

The frontend calls a serverless endpoint at `api/feedback.js`.

### Recommended deployment

Use Vercel for the live AI version of the site.

### Environment variables

Create a local `.env.local` file or add these variables in Vercel:

- `OPENAI_API_KEY`
- `OPENAI_MODEL` (optional, default is `gpt-4.1-mini`)

See `.env.example` for the expected format.

### How it works

- The browser sends the selected tool type and user input to `/api/feedback`.
- The serverless function builds a tool-specific prompt.
- OpenAI returns structured JSON.
- The frontend renders the returned feedback.
- If the API is unavailable, the site falls back to the built-in heuristic demo.

### Local development notes

If you open the site as plain static files or serve it with a simple static server, the AI API route will not run.
For full local testing of the serverless function, run the project with Vercel locally:

`vercel dev`

### GitHub Pages note

GitHub Pages can still host the static version of the portfolio, but it cannot securely run the OpenAI-backed serverless endpoint by itself.
To use live AI feedback, deploy the project to Vercel or another platform that supports server-side functions and environment variables.
