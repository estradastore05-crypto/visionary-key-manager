VISIONARY KEY MANAGER - READY FOR RENDER

This package is a generic key/licensing API.

Render:
1. Upload these files to a GitHub repository.
2. Render -> New -> Web Service -> connect the repository.
3. Build Command: npm install
4. Start Command: npm start
5. Add environment variable ADMIN_TOKEN with your own secret token.
6. Deploy.

The server binds to 0.0.0.0 and uses PORT, so it is ready for Render.

API:
POST /api/validate   body: {"key":"..."}
GET  /api/keys       Authorization: Bearer YOUR_ADMIN_TOKEN
POST /api/keys       Authorization: Bearer YOUR_ADMIN_TOKEN, body: {"days":30}
POST /api/keys/:key/pause
POST /api/keys/:key/resume
DELETE /api/keys/:key

Do not put ADMIN_TOKEN in client-side code.
