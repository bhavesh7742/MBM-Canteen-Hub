# MBM Canteen Hub — AWS Serverless Deployment Guide

## 🌐 Live Deployment Endpoints

| Resource | Service | Endpoint / Identifier |
|---|---|---|
| **Frontend Website** | Amazon S3 Static Website Hosting | [http://mbm-canteen-hub-frontend.s3-website.ap-south-1.amazonaws.com](http://mbm-canteen-hub-frontend.s3-website.ap-south-1.amazonaws.com) |
| **Backend API Gateway** | Amazon API Gateway (HTTP API) | `https://gyxpq1r1mg.execute-api.ap-south-1.amazonaws.com` |
| **API Health Check** | AWS Lambda via API Gateway | [https://gyxpq1r1mg.execute-api.ap-south-1.amazonaws.com/api/health](https://gyxpq1r1mg.execute-api.ap-south-1.amazonaws.com/api/health) |
| **Menu API Endpoint** | Express Router via Lambda | [https://gyxpq1r1mg.execute-api.ap-south-1.amazonaws.com/api/menu](https://gyxpq1r1mg.execute-api.ap-south-1.amazonaws.com/api/menu) |
| **AWS Region** | ap-south-1 (Mumbai) | `ap-south-1` |
| **Lambda Function** | AWS Lambda | `mbm-canteen-api` |
| **S3 Bucket** | Amazon S3 | `mbm-canteen-hub-frontend` |

---

## 📸 Live Application Preview

![MBM Canteen Hub Live Deployment](screenshots/live-application.png)

---

## Architecture

```
User (Browser)
      |
      |--- Frontend (HTML/CSS/JS)
      |         |
      |      S3 Bucket (Static Website Hosting)
      |      http://mbm-canteen-hub-frontend.s3-website.ap-south-1.amazonaws.com
      |
      |--- API Calls (/api/*)
                |
         API Gateway (HTTP API v2)
         https://gyxpq1r1mg.execute-api.ap-south-1.amazonaws.com
                |
         AWS Lambda Function (mbm-canteen-api)
                |
         Express 5 (serverless-http + buffer parsing fix)
                |
          MongoDB Atlas (ac-wsdsaby-shard)
```

## Services Used

| Service | Purpose | Cost |
|---|---|---|
| AWS Lambda | Runs Express backend on-demand | ~$0.20/million requests |
| API Gateway (HTTP API) | HTTP front door to Lambda | ~$1/million requests |
| S3 | Stores and hosts React static build files | ~$0.023/GB/month |
| MongoDB Atlas | Cloud database (free tier available) | Free (M0) |

**Estimated total cost for a college project: $0–$2/month**

---

## Prerequisites

- AWS account (free tier is sufficient)
- MongoDB Atlas account (free M0 cluster)
- AWS CLI installed: `winget install Amazon.AWSCLI`
- Node.js 20+ installed

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
| `FRONTEND_URL` | `http://mbm-canteen-hub-frontend.s3-website.ap-south-1.amazonaws.com` |

---

## Step 4 — Upload Code to Lambda

Code tab → Upload from → .zip file → upload `lambda-backend.zip` (contains `lambda.js`, `server.js`, `package.json`, `src/`, and `node_modules/`).

> [!NOTE]
> The backend contains a specialized middleware in `server.js` ensuring that `serverless-http` Buffer payloads are cleanly parsed in Express 5.

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
6. Live Invoke URL: `https://gyxpq1r1mg.execute-api.ap-south-1.amazonaws.com`

**CORS (API Gateway → CORS):**
- Allow Origin: `http://mbm-canteen-hub-frontend.s3-website.ap-south-1.amazonaws.com`
- Allow Headers: `content-type, authorization`
- Allow Methods: `GET, POST, PUT, DELETE, OPTIONS`
- Allow Credentials: `true`

---

## Step 7 — Build Frontend

Create `frontend/.env.production`:
```env
VITE_API_URL=https://gyxpq1r1mg.execute-api.ap-south-1.amazonaws.com/api
```

```bash
cd frontend
npm run build
```

This creates the production distribution at `frontend/dist/`.

---

## Step 8 — Create S3 Bucket & Host Static Website

1. S3 → **Create bucket** → name: `mbm-canteen-hub-frontend`
2. Region: `ap-south-1`
3. **Uncheck** Block all public access
4. Properties → **Static website hosting** → Enable
   - Index document: `index.html`
   - Error document: `index.html`
   - Website Endpoint: `http://mbm-canteen-hub-frontend.s3-website.ap-south-1.amazonaws.com`
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

6. Upload built frontend files:

```powershell
aws s3 sync frontend/dist/ s3://mbm-canteen-hub-frontend --delete
```

---

## Testing

```bash
# Backend health check
curl https://gyxpq1r1mg.execute-api.ap-south-1.amazonaws.com/api/health

# Backend menu
curl https://gyxpq1r1mg.execute-api.ap-south-1.amazonaws.com/api/menu

# Frontend
# Open in browser:
http://mbm-canteen-hub-frontend.s3-website.ap-south-1.amazonaws.com
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
