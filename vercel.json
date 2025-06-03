{
  "version": 2,
  "builds": [
    {
      "src": "backend/server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "backend/server.js"
    },
    {
      "src": "/",
      "dest": "frontend/index.html"
    },
    {
      "src": "/script.js",
      "dest": "frontend/script.js"
    },
    {
      "src": "/(.*)",
      "dest": "frontend/index.html"
    }
  ]
}
