# MBM Canteen Hub — AWS Serverless Deployment Guide

## Architecture

```
User (Browser)
      |
      |--- Frontend (HTML/CSS/JS)
      |         |
      |    CloudFront CDN  <-- fast global delivery
      |         |
      |      S3 Bucket     <-- static React build files
      |
      |--- API Calls (/api/*)
                |
         API Gateway (HTTP API)
                |
         AWS Lambda Function
                |
         Express (serverless-http)
                |
          MongoDB Atlas
```

## Services Used

| Service | Purpose | Cost |
|---|---|---|
| AWS Lambda | Runs Express backend on-demand | ~$0.20/million requests |
| API Gateway (HTTP API) | HTTP front door to Lambda | ~$1/million requests |
| S3 | Stores React static build files | ~$0.023/GB/month |
| CloudFront | CDN — serves frontend globally | ~$0.01/GB transferred |
| MongoDB Atlas | Cloud database (free tier available) | Free (M0) |

**Estimated total cost for a college project: $0–$2/month**

---

## Prerequisites

- AWS account (free tier is sufficient)
- MongoDB Atlas account (free M0 cluster)
- AWS CLI installed: `winget install Amazon.AWSCLI`
- Node.js 22 installed

---

## Step 1 — Prepare Backend

```powershell
cd backend
npm install --production

# Create deployment zip
Compress-Archive -Path . -DestinationPath ..\lambda-backend.zip -CompressionLevel Optimal
```

---

## Step 2 — Create Lambda Function

1. AWS Console → **Lambda** → **Create function**
2. Author from scratch
3. Name: `mbm-canteen-api`
4. Runtime: **Node.js 22.x**
5. Click **Create function**

---

## Step 3 — Configure Lambda

**Handler:** `lambda.handler`

**Configuration → General → Edit:**
- Memory: `256 MB`
- Timeout: `30 seconds`

**Configuration → Environment variables → Edit — add:**

| Key | Value |
|---|---|
| `NODE_ENV` | `production` |
| `MONGO_URI` | Your Atlas connection string |
| `JWT_SECRET` | 64-character random secret |
| `JWT_EXPIRE` | `7d` |
| `FRONTEND_URL` | `https://YOUR_CLOUDFRONT_DOMAIN.cloudfront.net` |

---

## Step 4 — Upload Code to Lambda

Code tab → Upload from → .zip file → upload `lambda-backend.zip`

---

## Step 5 — MongoDB Atlas Configuration

1. Atlas → **Network Access** → Add IP → `0.0.0.0/0`
2. Atlas → **Database Access** → Create user with `readWrite` role
3. Copy connection string → set as `MONGO_URI` in Lambda env vars

---

## Step 6 — Create API Gateway

1. AWS Console → **API Gateway** → **Create API** → **HTTP API**
2. Add integration: Lambda → `mbm-canteen-api`
3. Name: `mbm-canteen-api-gateway`
4. Routes: `$default` (Lambda handles all routing via Express)
5. Stage: `$default` with Auto-deploy ON
6. Copy the **Invoke URL**: `https://abc123.execute-api.ap-south-1.amazonaws.com`

**CORS (API Gateway → CORS):**
- Allow Origin: `https://YOUR_CLOUDFRONT_DOMAIN.cloudfront.net`
- Allow Headers: `Content-Type, Authorization`
- Allow Methods: `GET, POST, PUT, DELETE, OPTIONS`
- Allow Credentials: `true`

---

## Step 7 — Build Frontend

Create `frontend/.env.production`:
```
VITE_API_URL=https://abc123.execute-api.ap-south-1.amazonaws.com/api
```

```bash
cd frontend
npm run build
```

This creates `frontend/dist/`.

---

## Step 8 — Create S3 Bucket

1. S3 → **Create bucket** → name: `mbm-canteen-hub-frontend`
2. Region: `ap-south-1`
3. **Uncheck** Block all public access
4. Properties → **Static website hosting** → Enable
   - Index document: `index.html`
   - Error document: `index.html`
5. Permissions → **Bucket policy**:

```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": "*",
    "Action": "s3:GetObject",
    "Resource": "arn:aws:s3:::mbm-canteen-hub-frontend/*"
  }]
}
```

6. Upload dist files:

```powershell
aws s3 sync frontend/dist/ s3://mbm-canteen-hub-frontend --delete
```

---

## Step 9 — Create CloudFront Distribution

1. CloudFront → **Create distribution**
2. Origin domain: your S3 bucket
3. Viewer protocol: **Redirect HTTP to HTTPS**
4. Default root object: `index.html`
5. **Custom error responses** → Add:
   - 403 → `/index.html` → 200
   - 404 → `/index.html` → 200
6. Create and wait ~10 minutes
7. Copy domain: `https://d123abc.cloudfront.net`

**Update Lambda env var:** `FRONTEND_URL` = `https://d123abc.cloudfront.net`
**Update API Gateway CORS:** Allow Origin = `https://d123abc.cloudfront.net`

---

## Testing

```bash
# Backend health check
curl https://YOUR_API_GW_URL/api/health

# Backend menu
curl https://YOUR_API_GW_URL/api/menu

# Frontend
# Open https://d123abc.cloudfront.net in browser
```

---

## Updating the App

**Backend update:**
```powershell
cd backend
npm install --production
Compress-Archive -Path . -DestinationPath ..\lambda-backend.zip -Force
aws lambda update-function-code --function-name mbm-canteen-api --zip-file fileb://..\lambda-backend.zip
```

**Frontend update:**
```bash
cd frontend
npm run build
aws s3 sync dist/ s3://mbm-canteen-hub-frontend --delete
aws cloudfront create-invalidation --distribution-id YOUR_DIST_ID --paths "/*"
```

---

## Monitoring

- Lambda logs: CloudWatch → Log groups → `/aws/lambda/mbm-canteen-api`
- Lambda metrics: Lambda → Monitor tab → Invocations, Errors, Duration
- API Gateway: API Gateway → Logs (enable in stage settings)

---

## Local Development

Nothing changes for local development:

```bash
# Backend
cd backend
npm run dev     # nodemon server.js on port 5000

# Frontend
cd frontend
npm run dev     # Vite dev server on port 5173 (proxies /api to localhost:5000)
```

The `if (require.main === module)` block in `server.js` ensures local dev still
starts the server normally — Lambda never hits that block.
