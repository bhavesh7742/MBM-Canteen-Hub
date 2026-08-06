# 🍽️ MBM Canteen Hub

A full-stack, production-ready college canteen ordering system with real-time order updates, Kubernetes deployment on AWS EKS, automated CI/CD via GitHub Actions, and live monitoring with Prometheus and Grafana.

---


## 🐳 Docker Architecture — Local Development

```
 Your Machine
┌─────────────────────────────────────────────────────────────────────┐
│                      docker-compose up -d                            │
│                                                                       │
│   mbm-network (bridge)                                                │
│  ┌──────────────────┐    ┌──────────────────────────────────────┐   │
│  │  mbm-frontend    │    │           mbm-backend                 │   │
│  │  nginx:stable    │    │         node:22-alpine                │   │
│  │                  │    │                                        │   │
│  │  React SPA       │───▶│  Express.js + Socket.io               │   │
│  │  (static files)  │    │  /api/*  →  route handlers            │   │
│  │                  │    │  /api/metrics → Prometheus            │   │
│  │  :80 ──────────────────────────────── :5000                   │   │
│  └──────────────────┘    └──────────────────┬────────────────────┘   │
│                                              │ mongoose                │
│  ┌──────────────────┐    ┌──────────────────▼────────────────────┐   │
│  │  mbm-grafana     │    │         MongoDB Atlas                  │   │
│  │  grafana:10.4.0  │    │    (cloud — not in Docker)            │   │
│  │                  │    │    SRV: backend.gm4jseh.mongodb.net    │   │
│  │  dashboards      │    │    DNS: 8.8.8.8 / 1.1.1.1 (injected) │   │
│  │  :3001 ──────────────────────────────────────────────────────  │   │
│  └──────────────────┘    └───────────────────────────────────────┘   │
│           │                                                            │
│  ┌────────▼─────────┐                                                 │
│  │  mbm-prometheus  │                                                 │
│  │  prom:v2.51.0    │     Named Volumes                              │
│  │                  │     prometheus_data:/prometheus  (7d retention) │
│  │  scrapes /api/   │     grafana_data:/var/lib/grafana              │
│  │  metrics every   │                                                 │
│  │  15s             │                                                 │
│  │  :9090           │                                                 │
│  └──────────────────┘                                                 │
└─────────────────────────────────────────────────────────────────────┘

Ports exposed to your browser:
  :80    → http://localhost       (React App)
  :5000  → http://localhost:5000  (Backend API)
  :9090  → http://localhost:9090  (Prometheus)
  :3001  → http://localhost:3001  (Grafana)
```

---

## ☁️ Production Architecture — AWS EKS

```
 Developer
     │  git push main
     ▼
┌────────────────────────────────────────┐
│         GitHub Actions CI/CD           │
│                                        │
│  Job 1: Lint & Build                  │
│    npm run lint  (ESLint)              │
│    npm run build (Vite)                │
│    node smoke test                     │
│              │                         │
│  Job 2: Build & Push Docker Images    │
│    docker build ./backend             │
│    docker build ./frontend            │
│    docker push → Amazon ECR           │
│    Tag: git SHA (e.g. abc12345)        │
│              │                         │
│  Job 3: Deploy to EKS                 │
│    kubectl set image (rolling update) │
│    kubectl rollout status             │
│    auto-rollback on failure           │
└──────────────┬─────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────────────────────┐
│                    Amazon ECR                                  │
│  mbm-canteen-backend:abc12345  (Node.js image)               │
│  mbm-canteen-frontend:abc12345 (nginx + React image)          │
└──────────────┬───────────────────────────────────────────────┘
               │  kubectl pull image
               ▼
┌──────────────────────────────────────────────────────────────┐
│              Amazon EKS Cluster  (ap-south-1)                 │
│                                                               │
│  namespace: production                                        │
│  ┌─────────────────────┐    ┌─────────────────────────────┐  │
│  │  mbm-frontend       │    │  mbm-backend                 │  │
│  │  Deployment (2 pods)│    │  Deployment (2 pods)         │  │
│  │                     │    │                              │  │
│  │  nginx:stable-alpine│    │  node:22-alpine              │  │
│  │  React SPA          │    │  Express + Socket.io         │  │
│  │  /health → 200 OK   │    │  /api/health probe           │  │
│  │  ClusterIP svc :80  │    │  HPA: 1–3 pods auto-scale    │  │
│  └─────────┬───────────┘    └────────────┬────────────────┘  │
│            │                              │                    │
│  ┌─────────▼──────────────────────────── ▼──────────────────┐ │
│  │         AWS ALB Ingress (mbm-ingress)                     │ │
│  │                                                            │ │
│  │   HTTPS :443 → SSL terminate (ACM cert)                   │ │
│  │   /          → mbm-frontend-svc :80                       │ │
│  │   /api/*     → mbm-backend-svc  :80                       │ │
│  │   /socket.io → mbm-backend-svc  :80  (sticky sessions)    │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                               │
│  namespace: monitoring                                        │
│  ┌─────────────────────┐    ┌─────────────────────────────┐  │
│  │  Prometheus (1 pod) │    │  Grafana (1 pod)             │  │
│  │  prom:v2.51.0       │    │  grafana:10.4.0              │  │
│  │  PVC: 10Gi EBS      │    │  auto-provisioned datasource │  │
│  │  scrapes production │    │  LoadBalancer svc            │  │
│  │  pods via K8s SD    │    │  (admin access only)         │  │
│  └─────────────────────┘    └─────────────────────────────┘  │
└───────────────────────────────────┬──────────────────────────┘
                                    │ mongoose
                                    ▼
                     ┌──────────────────────────────┐
                     │       MongoDB Atlas           │
                     │  backend.gm4jseh.mongodb.net  │
                     │  Free Tier M0 cluster         │
                     └──────────────────────────────┘
```

---

## 🗺️ Complete Deployment Roadmap 

> Run these commands **in order**. Each section builds on the previous one.

### PHASE 0 — Verify Local Setup ✅

```bash
# 1. Create .env file at the project root
echo "MONGO_URI=mongodb+srv://mbmadmin:bhavesh_5708@backend.gm4jseh.mongodb.net/mbm-canteen-hub" > .env
echo "JWT_SECRET=your_super_long_secret_key_here" >> .env

# 2. Start everything with Docker Compose
docker-compose up -d

# 3. Verify the backend is alive
curl http://localhost:5000/api/health
# Expected: {"status":"ok","message":"MBM Canteen Hub API is running 🚀"}

# 4. Open your browser
#    http://localhost       → React App
#    http://localhost:9090  → Prometheus
#    http://localhost:3001  → Grafana (admin/admin)

# 5. Stop when done
docker-compose down
```

---

### PHASE 1 — AWS Account + CLI Setup

```bash
# 1. Install AWS CLI (if not already)
#    Windows: winget install Amazon.AWSCLI
#    Mac:     brew install awscli
#    Linux:   sudo apt install awscli

# 2. Configure with your AWS credentials
aws configure
#  AWS Access Key ID:     [paste from AWS Console]
#  AWS Secret Access Key: [paste from AWS Console]
#  Default region:        ap-south-1
#  Output format:         json

# 3. Verify
aws sts get-caller-identity
# Shows your account ID, user ARN — if you see this, AWS CLI is working
```

---

### PHASE 2 — Create ECR Repositories (Docker Registry)

```bash
# Save your account ID
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

# Create backend repository
aws ecr create-repository \
    --repository-name mbm-canteen-backend \
    --region ap-south-1 \
    --image-scanning-configuration scanOnPush=true

# Create frontend repository
aws ecr create-repository \
    --repository-name mbm-canteen-frontend \
    --region ap-south-1 \
    --image-scanning-configuration scanOnPush=true

# Verify both exist
aws ecr describe-repositories --region ap-south-1 --query 'repositories[].repositoryName'
```

---

### PHASE 3 — Push Docker Images to ECR (First Time)

```bash
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ECR_URL="${ACCOUNT_ID}.dkr.ecr.ap-south-1.amazonaws.com"

# Login Docker to ECR
aws ecr get-login-password --region ap-south-1 | \
    docker login --username AWS --password-stdin $ECR_URL

# Build & push BACKEND
cd backend
docker build -t mbm-canteen-backend .
docker tag mbm-canteen-backend:latest $ECR_URL/mbm-canteen-backend:latest
docker push $ECR_URL/mbm-canteen-backend:latest
cd ..

# Build & push FRONTEND
cd frontend
docker build \
    --build-arg VITE_API_URL=https://mbmcanteen.local.com \
    -t mbm-canteen-frontend .
docker tag mbm-canteen-frontend:latest $ECR_URL/mbm-canteen-frontend:latest
docker push $ECR_URL/mbm-canteen-frontend:latest
cd ..
```

---

### PHASE 4 — Create EKS Cluster (takes 15–20 min)

```bash
# Install eksctl first:
#   Windows: winget install eksctl.eksctl
#   Mac:     brew install eksctl

# Create the cluster
eksctl create cluster \
    --name mbm-canteen-cluster \
    --region ap-south-1 \
    --version 1.31 \
    --nodegroup-name mbm-nodes \
    --node-type t3.micro \
    --nodes 2 \
    --nodes-min 1 \
    --nodes-max 3 \
    --managed

# Connect kubectl to the cluster
aws eks update-kubeconfig \
    --name mbm-canteen-cluster \
    --region ap-south-1

# Verify cluster is running
kubectl get nodes
# Expected: 2 nodes with STATUS=Ready
```

---

### PHASE 5 — Install AWS Load Balancer Controller

```bash
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

# Download IAM policy
curl -O https://raw.githubusercontent.com/kubernetes-sigs/aws-load-balancer-controller/v2.7.0/docs/install/iam_policy.json

# Create the policy
aws iam create-policy \
    --policy-name AWSLoadBalancerControllerIAMPolicy \
    --policy-document file://iam_policy.json

# Create the service account
eksctl create iamserviceaccount \
    --cluster=mbm-canteen-cluster \
    --namespace=kube-system \
    --name=aws-load-balancer-controller \
    --role-name AmazonEKSLoadBalancerControllerRole \
    --attach-policy-arn=arn:aws:iam::${ACCOUNT_ID}:policy/AWSLoadBalancerControllerIAMPolicy \
    --approve \
    --region=ap-south-1

# Install with Helm
#   Windows: winget install Helm.Helm
#   Mac:     brew install helm
helm repo add eks https://aws.github.io/eks-charts && helm repo update
helm install aws-load-balancer-controller eks/aws-load-balancer-controller \
    -n kube-system \
    --set clusterName=mbm-canteen-cluster \
    --set serviceAccount.create=false \
    --set serviceAccount.name=aws-load-balancer-controller

# Verify
kubectl get deployment -n kube-system aws-load-balancer-controller
```

---

### PHASE 6 — Deploy to Kubernetes

```bash
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

# 1. Replace YOUR_AWS_ACCOUNT_ID in the manifests with your real account ID
#    Windows (PowerShell):
(Get-Content k8s/production/backend-deployment.yaml) -replace 'YOUR_AWS_ACCOUNT_ID', $ACCOUNT_ID | Set-Content k8s/production/backend-deployment.yaml
(Get-Content k8s/production/frontend-deployment.yaml) -replace 'YOUR_AWS_ACCOUNT_ID', $ACCOUNT_ID | Set-Content k8s/production/frontend-deployment.yaml

# 2. Create namespace
kubectl apply -f k8s/production/namespace.yaml
kubectl apply -f k8s/monitoring/prometheus-deployment.yaml

# 3. Create the Kubernetes secret with real credentials
kubectl create secret generic mbm-secrets \
    --from-literal=mongo-uri='mongodb+srv://mbmadmin:bhavesh_5708@backend.gm4jseh.mongodb.net/mbm-canteen-hub' \
    --from-literal=jwt-secret='your_jwt_secret_here' \
    -n production

# 4. Apply all production manifests
kubectl apply -f k8s/production/

# 5. Watch pods come up
kubectl get pods -n production -w
# Wait until all pods show: Running  1/1

# 6. Get the ALB address (takes ~3 minutes to provision)
kubectl get ingress -n production
# Copy the ADDRESS column value
```

---

### PHASE 7 — Set Up CI/CD (GitHub Actions)

```bash
# 1. Create IAM user for GitHub Actions
aws iam create-user --user-name mbm-github-actions

# 2. Generate access keys (save these!)
aws iam create-access-key --user-name mbm-github-actions

# 3. Add to GitHub: Settings → Secrets → Actions
#    AWS_ACCESS_KEY_ID      = (from step 2)
#    AWS_SECRET_ACCESS_KEY  = (from step 2)
#    AWS_ACCOUNT_ID         = (your 12-digit account ID)
#    VITE_API_URL           = https://mbmcanteen.local.com

# 4. Now every push to main auto-deploys!
git add .
git commit -m "feat: production deployment setup"
git push origin main
# → GitHub Actions runs → builds images → pushes to ECR → deploys to EKS
```

---

### PHASE 8 — Verify Everything is Live

```bash
# Check pods
kubectl get pods -n production
kubectl get pods -n monitoring

# Check services
kubectl get svc -n production

# Check ingress (get your public URL)
kubectl get ingress -n production

# Test the live API
curl https://mbmcanteen.local.com/api/health

# Check Grafana is up
kubectl get svc grafana-service -n monitoring
```

---



## 🛠️ Technology Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| React 18 | UI framework |
| Redux Toolkit | State management (cart, auth, orders) |
| React Router | Client-side navigation |
| Tailwind CSS | Utility-first styling |
| Socket.io Client | Real-time order status updates |
| Vite | Build tool |

### Backend
| Technology | Purpose |
|------------|---------|
| Node.js 22 | Runtime |
| Express.js 5 | HTTP server and routing |
| Socket.io 4 | WebSocket server for real-time updates |
| Mongoose | MongoDB ODM |
| JWT (jsonwebtoken) | Authentication |
| bcryptjs | Password hashing |
| prom-client | Prometheus metrics |
| Morgan | HTTP request logging |

### Infrastructure
| Technology | Purpose |
|------------|---------|
| Docker | Container packaging |
| Amazon ECR | Private Docker registry |
| Amazon EKS | Managed Kubernetes |
| AWS ALB | Load balancer and HTTPS termination |
| AWS ACM | SSL/TLS certificates |
| MongoDB Atlas | Cloud database |
| Prometheus | Metrics collection |
| Grafana | Metrics visualization |
| GitHub Actions | CI/CD pipeline |

---

## 🚀 Features

### Student Features
- 🍛 Browse menu with categories and filters
- ❤️ Save favorite dishes
- 🛒 Add to cart and place orders
- 📡 Real-time order status updates (Socket.io)
- 📋 Order history
- 👤 Profile management
- ⭐ Leave feedback/ratings

### Admin Features
- 📊 Dashboard with sales analytics
- 🍽️ Menu management (add/edit/delete dishes)
- 📦 Order management and status updates
- 👥 User management
- 💬 View student feedback

---

## 📂 Project Structure

```
mbm-canteen-hub/
│
├── .github/
│   └── workflows/
│       ├── deploy.yml          # Main CI/CD pipeline (3 jobs)
│       └── pr-check.yml        # PR validation
│
├── backend/
│   ├── Dockerfile              # Multi-stage Node.js container
│   ├── .dockerignore
│   ├── server.js               # Express app entry point
│   └── src/
│       ├── config/db.js        # MongoDB connection
│       ├── controllers/        # Route handlers
│       ├── middleware/
│       │   ├── auth.js         # JWT verification
│       │   └── metrics.js      # Prometheus middleware
│       ├── models/             # Mongoose schemas
│       └── routes/             # API endpoints
│
├── frontend/
│   ├── Dockerfile              # Multi-stage React → nginx container
│   ├── nginx.conf              # React Router + WebSocket proxy config
│   ├── .dockerignore
│   └── src/
│       ├── components/         # Reusable UI components
│       ├── pages/              # Route pages
│       ├── redux/              # Redux slices and store
│       └── utils/              # Helper functions
│
├── k8s/
│   ├── production/
│   │   ├── namespace.yaml       # Kubernetes namespace
│   │   ├── configmap.yaml       # Non-secret configuration
│   │   ├── secret.yaml          # Secret template (do not commit with real values)
│   │   ├── backend-deployment.yaml
│   │   ├── backend-service.yaml
│   │   ├── backend-hpa.yaml     # Horizontal Pod Autoscaler
│   │   ├── frontend-deployment.yaml
│   │   ├── frontend-service.yaml
│   │   └── ingress.yaml         # ALB Ingress (HTTPS + routing)
│   └── monitoring/
│       ├── prometheus-deployment.yaml  # Prometheus + RBAC + PVC
│       └── grafana-deployment.yaml     # Grafana + auto-provisioning
│
├── monitoring/
│   └── prometheus.yml          # Prometheus config for local Docker Compose
│
├── scripts/
│   └── aws-setup.sh            # Manual AWS CLI setup commands
│
├── docker-compose.yml          # Local development environment
├── DEPLOYMENT.md               # Complete step-by-step deployment guide
└── README.md                   # This file
```

---

## 🏃 Quick Start — Local Development

### 1. Clone and configure

```bash
git clone <your-repo-url>
cd mbm-canteen-hub
```

Create `.env` file at the project root:

```env
MONGO_URI=mongodb+srv://your-user:your-pass@cluster.mongodb.net/mbm-canteen-hub
JWT_SECRET=your_super_secret_key_min_32_chars
JWT_EXPIRE=7d
```

### 2. Start with Docker Compose

```bash
docker-compose up -d
```

This starts:
- **Frontend**: http://localhost:80
- **Backend API**: http://localhost:5000
- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3001 (admin/admin)

### 3. Verify

```bash
curl http://localhost:5000/api/health
# {"status":"ok","message":"MBM Canteen Hub API is running 🚀"}
```

---

## 🚢 Production Deployment

See **[DEPLOYMENT.md](./DEPLOYMENT.md)** for the complete 25-step guide covering:
- AWS account setup
- ECR repository creation
- EKS cluster creation (eksctl)
- ALB controller installation
- SSL certificate setup
- Kubernetes deployment
- DNS configuration
- GitHub Actions CI/CD setup
- Monitoring setup
- Troubleshooting

---

## 🔄 CI/CD Pipeline

Every `git push` to `main` triggers a 3-job pipeline:

```
Push to main
     │
     ▼
Job 1: Lint & Build (always runs)
  ├── npm run lint (ESLint)
  ├── npm run build (Vite compile)
  └── node smoke test
     │
     ▼ (only on main push)
Job 2: Build & Push Docker Images
  ├── Build backend image
  ├── Build frontend image (with VITE_API_URL baked in)
  └── Push both to Amazon ECR with git SHA tag
     │
     ▼
Job 3: Deploy to EKS
  ├── kubectl set image (rolling update)
  ├── Wait for rollout (timeout 5 min)
  ├── Show pod status
  └── Auto-rollback if failure
```

---

## 📡 API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/health` | None | Health check |
| `POST` | `/api/auth/register` | None | Student registration |
| `POST` | `/api/auth/login` | None | Login |
| `GET` | `/api/menu` | None | Get all menu items |
| `GET` | `/api/menu/:id` | None | Get single dish |
| `GET` | `/api/cart` | 🔐 Student | Get user's cart |
| `POST` | `/api/cart` | 🔐 Student | Add to cart |
| `POST` | `/api/orders` | 🔐 Student | Place order |
| `GET` | `/api/orders/my-orders` | 🔐 Student | Order history |
| `GET` | `/api/admin/orders` | 🔑 Admin | All orders |
| `PUT` | `/api/admin/orders/:id` | 🔑 Admin | Update order status |
| `GET` | `/api/metrics` | None | Prometheus metrics |

---

## 📊 Monitoring

### Prometheus Metrics

The backend exposes metrics at `/api/metrics`:
- `http_request_duration_seconds` — Request latency histogram
- `http_requests_total` — Total request counter by method/route/status
- `socket_connections_active` — Live WebSocket connections

### Grafana Dashboards

Access at your Grafana URL with dashboards for:
- HTTP request rate and response time
- Active WebSocket connections (real-time orders)
- Pod resource usage (CPU/memory)

---

## 🔐 GitHub Actions Secrets Required

| Secret | Description |
|--------|-------------|
| `AWS_ACCESS_KEY_ID` | IAM user access key |
| `AWS_SECRET_ACCESS_KEY` | IAM user secret key |
| `AWS_ACCOUNT_ID` | Your 12-digit AWS account ID |
| `VITE_API_URL` | Backend API URL (e.g. `https://api.mbmcanteen.com`) |

---

## 🤝 Team

**Project**: MBM Canteen Hub  
**Stack**: React + Node.js + MongoDB + Docker + EKS  
**Infrastructure**: Manual AWS setup (No Terraform)

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.
