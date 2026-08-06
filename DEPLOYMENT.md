# MBM Canteen Hub — Complete Deployment Guide

> **Who is this for?**
> This guide is written for beginners. Every step has an explanation of *what* you're doing and *why* you're doing it. No Terraform. No IaC. Everything manual via AWS Console or AWS CLI.

---

## Prerequisites — Install These First

| Tool | Why you need it | Install |
|------|----------------|---------|
| AWS CLI | Send commands to AWS from your terminal | [docs.aws.amazon.com](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html) |
| eksctl | Create/manage EKS clusters | [eksctl.io](https://eksctl.io/installation/) |
| kubectl | Talk to your Kubernetes cluster | [kubernetes.io](https://kubernetes.io/docs/tasks/tools/) |
| Helm | Install Kubernetes add-ons (like ALB controller) | [helm.sh](https://helm.sh/docs/intro/install/) |
| Docker | Build and test container images locally | [docker.com](https://docs.docker.com/get-docker/) |

---

## Part 1 — Local Development (No AWS needed)

### Step 1: Clone the project and set up environment

```bash
git clone <your-repo-url>
cd mbm-canteen-hub

# Create your .env file at the project root
cp backend/.env.example .env   # if example exists, otherwise:
```

Create a file called `.env` in the project root with:

```env
MONGO_URI=mongodb+srv://mbmadmin:bhavesh_5708@backend.gm4jseh.mongodb.net/mbm-canteen-hub
JWT_SECRET=your_super_secret_jwt_key_min_32_characters_long
JWT_EXPIRE=7d
```

> **Why MONGO_URI?** This is the connection string to your MongoDB Atlas database in the cloud. Your backend reads this to know where to store data.

> **Why JWT_SECRET?** This is the key used to sign and verify login tokens. If someone gets this, they can fake logins — keep it secret and make it long (32+ characters).

### Step 2: Run locally with Docker Compose

```bash
# This builds both Docker images and starts all 4 services:
# - mbm-backend  (port 5000)
# - mbm-frontend (port 80)
# - prometheus   (port 9090)
# - grafana      (port 3001)
docker-compose up -d
```

### Step 3: Verify everything is running

```bash
# Check all containers are healthy
docker ps

# Test the backend API
curl http://localhost:5000/api/health
# Expected: {"status":"ok","message":"MBM Canteen Hub API is running 🚀"}

# Open the app in your browser
# http://localhost:80  → React frontend
# http://localhost:9090 → Prometheus
# http://localhost:3001 → Grafana (login: admin / admin)
```

### Step 4: Stop local environment

```bash
docker-compose down
```

---

## Part 2 — AWS Account Setup

### Step 5: Create AWS Account and IAM User

1. Go to [aws.amazon.com](https://aws.amazon.com) and create an account
2. After login, search for **IAM** in the top search bar
3. Go to **Users** → **Create user**
4. Name: `mbm-admin`
5. Attach policy: **AdministratorAccess** *(for initial setup only)*
6. Go to **Security credentials** tab → **Create access key** → **CLI**
7. Save the **Access Key ID** and **Secret Access Key**

### Step 6: Configure AWS CLI

```bash
aws configure
# Enter:
# AWS Access Key ID: [paste your access key]
# AWS Secret Access Key: [paste your secret key]
# Default region: ap-south-1
# Default output format: json

# Verify it works:
aws sts get-caller-identity
# Expected: your account ID and user details
```

> **Why configure AWS CLI?** This stores your credentials in `~/.aws/credentials`. All commands you run after this will automatically authenticate with AWS.

---

## Part 3 — Create ECR Repositories

> **What is ECR?** Elastic Container Registry — Amazon's private Docker Hub. Your Docker images are stored here. When Kubernetes deploys your app, it pulls the image from ECR.

### Step 7: Create ECR repositories

**Option A: AWS Console**
1. Search for **ECR** in the AWS console
2. **Create repository** → Name: `mbm-canteen-backend` → Enable **Image scanning** → Create
3. **Create repository** → Name: `mbm-canteen-frontend` → Enable **Image scanning** → Create

**Option B: AWS CLI**
```bash
# Get your account ID first
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo "Your account ID: $ACCOUNT_ID"

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
```

### Step 8: Push Docker images to ECR

```bash
# Get an authentication token (valid 12 hours)
aws ecr get-login-password --region ap-south-1 | \
    docker login --username AWS --password-stdin \
    $ACCOUNT_ID.dkr.ecr.ap-south-1.amazonaws.com

# Build and push backend
docker build -t mbm-canteen-backend ./backend
docker tag mbm-canteen-backend:latest \
    $ACCOUNT_ID.dkr.ecr.ap-south-1.amazonaws.com/mbm-canteen-backend:latest
docker push $ACCOUNT_ID.dkr.ecr.ap-south-1.amazonaws.com/mbm-canteen-backend:latest

# Build and push frontend
docker build \
    --build-arg VITE_API_URL=https://api.mbmcanteen.yourdomain.com \
    -t mbm-canteen-frontend ./frontend
docker tag mbm-canteen-frontend:latest \
    $ACCOUNT_ID.dkr.ecr.ap-south-1.amazonaws.com/mbm-canteen-frontend:latest
docker push $ACCOUNT_ID.dkr.ecr.ap-south-1.amazonaws.com/mbm-canteen-frontend:latest
```

---

## Part 4 — Create EKS Cluster

> **What is EKS?** Elastic Kubernetes Service — Amazon's managed Kubernetes. AWS manages the control plane (the Kubernetes master node) for you. You only manage the worker nodes (EC2 instances that actually run your pods).

### Step 9: Create the EKS cluster

> ⚠️ This takes 15–20 minutes. This is normal.

```bash
eksctl create cluster \
    --name mbm-canteen-cluster \
    --region ap-south-1 \
    --version 1.31 \
    --nodegroup-name mbm-nodes \
    --node-type t3.micro \
    --nodes 2 \
    --nodes-min 1 \
    --nodes-max 3 \
    --managed \
    --asg-access \
    --with-oidc \
    --alb-ingress-access
```

### Step 10: Connect kubectl to your cluster

```bash
aws eks update-kubeconfig \
    --name mbm-canteen-cluster \
    --region ap-south-1

# Verify connection
kubectl get nodes
# Expected: 2 nodes with status Ready
```

> **Why this command?** It adds authentication credentials to `~/.kube/config` so kubectl knows how to reach your EKS cluster.

---

## Part 5 — Install AWS Load Balancer Controller

> **What is this?** The ALB controller watches for Kubernetes Ingress resources. When it sees one, it automatically creates an Application Load Balancer (ALB) in AWS. Without it, `ingress.yaml` won't do anything.

### Step 11: Create IAM policy for ALB controller

```bash
# Download the official policy document from AWS
curl -O https://raw.githubusercontent.com/kubernetes-sigs/aws-load-balancer-controller/v2.7.0/docs/install/iam_policy.json

# Create the policy in AWS
aws iam create-policy \
    --policy-name AWSLoadBalancerControllerIAMPolicy \
    --policy-document file://iam_policy.json
```

### Step 12: Create service account for ALB controller

```bash
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

eksctl create iamserviceaccount \
    --cluster=mbm-canteen-cluster \
    --namespace=kube-system \
    --name=aws-load-balancer-controller \
    --role-name AmazonEKSLoadBalancerControllerRole \
    --attach-policy-arn=arn:aws:iam::${ACCOUNT_ID}:policy/AWSLoadBalancerControllerIAMPolicy \
    --approve \
    --region=ap-south-1
```

### Step 13: Install ALB controller with Helm

```bash
helm repo add eks https://aws.github.io/eks-charts
helm repo update eks

helm install aws-load-balancer-controller eks/aws-load-balancer-controller \
    -n kube-system \
    --set clusterName=mbm-canteen-cluster \
    --set serviceAccount.create=false \
    --set serviceAccount.name=aws-load-balancer-controller

# Verify the controller is running
kubectl get deployment -n kube-system aws-load-balancer-controller
```

---

## Part 6 — Deploy the Application

### Step 14: Update configuration files

**In `k8s/production/backend-deployment.yaml`:**
Replace `YOUR_AWS_ACCOUNT_ID` with your actual 12-digit AWS account ID:
```bash
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo "Replace YOUR_AWS_ACCOUNT_ID with: $ACCOUNT_ID"
```

**In `k8s/production/frontend-deployment.yaml`:**
Replace `YOUR_AWS_ACCOUNT_ID` with your account ID.

**In `k8s/production/configmap.yaml`:**
Replace `mbmcanteen.yourdomain.com` with your actual domain name.

**In `k8s/production/ingress.yaml`:**
Replace `mbmcanteen.yourdomain.com` with your actual domain name.
Replace `YOUR_ACM_CERTIFICATE_ARN` with your SSL certificate ARN (Step 16).

### Step 15: Create Kubernetes namespace

```bash
kubectl apply -f k8s/production/namespace.yaml
kubectl apply -f k8s/monitoring/prometheus-deployment.yaml

# Verify
kubectl get namespaces
```

### Step 16: Create SSL Certificate (HTTPS)

1. Go to AWS Console → **Certificate Manager (ACM)**
2. Click **Request certificate** → **Request a public certificate**
3. Enter your domain: `mbmcanteen.yourdomain.com`
4. Choose **DNS validation** → **Request**
5. Click the certificate → **Create records in Route 53** (if using Route 53) OR add the CNAME records manually to your DNS provider
6. Wait for status to become **Issued** (~5 minutes)
7. Copy the **Certificate ARN** (looks like: `arn:aws:acm:ap-south-1:123456789012:certificate/abc-def-123`)
8. Paste it into `k8s/production/ingress.yaml` where it says `YOUR_ACM_CERTIFICATE_ARN`

### Step 17: Create Kubernetes Secrets

> ⚠️ Never put actual secrets in YAML files that get committed to Git!

```bash
# Create the secret using kubectl directly
kubectl create secret generic mbm-secrets \
    --from-literal=mongo-uri='mongodb+srv://mbmadmin:bhavesh_5708@backend.gm4jseh.mongodb.net/mbm-canteen-hub' \
    --from-literal=jwt-secret='your_super_long_jwt_secret_key_here' \
    -n production

# Verify (values are hidden by default)
kubectl get secret mbm-secrets -n production
```

### Step 18: Apply all Kubernetes manifests

```bash
# Deploy everything
kubectl apply -f k8s/production/configmap.yaml
kubectl apply -f k8s/production/backend-deployment.yaml
kubectl apply -f k8s/production/backend-service.yaml
kubectl apply -f k8s/production/backend-hpa.yaml
kubectl apply -f k8s/production/frontend-deployment.yaml
kubectl apply -f k8s/production/frontend-service.yaml
kubectl apply -f k8s/production/ingress.yaml

# Deploy monitoring
kubectl apply -f k8s/monitoring/
```

### Step 19: Watch pods come up

```bash
# Watch pods start in real time (Ctrl+C to stop)
kubectl get pods -n production -w

# Expected output:
# NAME                            READY   STATUS    RESTARTS   AGE
# mbm-backend-xxx-yyy             1/1     Running   0          2m
# mbm-backend-xxx-zzz             1/1     Running   0          2m
# mbm-frontend-xxx-yyy            1/1     Running   0          2m
# mbm-frontend-xxx-zzz            1/1     Running   0          2m
```

### Step 20: Get the load balancer address

```bash
kubectl get ingress -n production

# Expected output:
# NAME          CLASS    HOSTS                    ADDRESS                           PORTS
# mbm-ingress   <none>   mbmcanteen.yourdomain.com   k8s-prod-mbm-xxx.ap-south-1.elb.amazonaws.com   80, 443
```

Copy the ADDRESS value — this is your ALB's DNS name.

---

## Part 7 — Configure DNS

### Step 21: Point your domain to the ALB

**If using AWS Route 53:**
1. Go to Route 53 → Hosted Zones → your domain
2. Create Record → Type: **A** → Enable **Alias**
3. Route traffic to: **Application and Classic Load Balancer**
4. Select region: **ap-south-1**
5. Select the load balancer that was just created
6. Save

**If using another DNS provider (GoDaddy, Namecheap, etc.):**
1. Go to your DNS settings
2. Add a **CNAME** record:
   - Name: `@` (or `mbmcanteen`)
   - Value: paste the ALB DNS address from Step 20
3. Wait up to 30 minutes for DNS to propagate

### Step 22: Verify the deployment

```bash
# Wait for DNS to propagate, then:
curl https://mbmcanteen.yourdomain.com/api/health
# Expected: {"status":"ok","message":"MBM Canteen Hub API is running 🚀"}

# Check all pods are healthy
kubectl get pods -n production
kubectl get pods -n monitoring
```

---

## Part 8 — Set Up CI/CD (GitHub Actions)

### Step 23: Create GitHub Actions IAM User

```bash
# Create a dedicated IAM user for GitHub Actions
aws iam create-user --user-name mbm-github-actions

# Create and attach the deployment policy
cat > /tmp/github-actions-policy.json << 'EOF'
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "ecr:GetAuthorizationToken",
                "ecr:BatchCheckLayerAvailability",
                "ecr:GetDownloadUrlForLayer",
                "ecr:BatchGetImage",
                "ecr:InitiateLayerUpload",
                "ecr:UploadLayerPart",
                "ecr:CompleteLayerUpload",
                "ecr:PutImage"
            ],
            "Resource": "*"
        },
        {
            "Effect": "Allow",
            "Action": [
                "eks:DescribeCluster",
                "eks:ListClusters"
            ],
            "Resource": "*"
        }
    ]
}
EOF

ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

aws iam create-policy \
    --policy-name MBMGitHubActionsPolicy \
    --policy-document file:///tmp/github-actions-policy.json

aws iam attach-user-policy \
    --user-name mbm-github-actions \
    --policy-arn arn:aws:iam::${ACCOUNT_ID}:policy/MBMGitHubActionsPolicy

# Create access keys — SAVE THESE!
aws iam create-access-key --user-name mbm-github-actions
```

### Step 24: Add GitHub Actions kubectl access

```bash
# Allow the github-actions IAM user to manage your EKS cluster
# Get the current aws-auth ConfigMap
kubectl get configmap aws-auth -n kube-system -o yaml > /tmp/aws-auth.yaml

# Add the GitHub Actions user to aws-auth
# Edit /tmp/aws-auth.yaml and add under mapUsers:
# - userarn: arn:aws:iam::<account-id>:user/mbm-github-actions
#   username: mbm-github-actions
#   groups:
#     - system:masters

kubectl apply -f /tmp/aws-auth.yaml
```

### Step 25: Add GitHub Secrets

Go to your GitHub repository → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

Add these secrets:

| Secret Name | Value |
|-------------|-------|
| `AWS_ACCESS_KEY_ID` | Access key for `mbm-github-actions` user |
| `AWS_SECRET_ACCESS_KEY` | Secret key for `mbm-github-actions` user |
| `AWS_ACCOUNT_ID` | Your 12-digit AWS account ID |
| `VITE_API_URL` | `https://mbmcanteen.yourdomain.com` |

Now push to the `main` branch — the GitHub Actions pipeline will:
1. ✅ Lint and build your code
2. 🐳 Build Docker images and push to ECR
3. 🚀 Deploy to EKS with rolling update

---

## Part 9 — Monitoring

### View Grafana Dashboard

```bash
# Get the Grafana load balancer address
kubectl get svc grafana-service -n monitoring
```

Open the ADDRESS in your browser:
- **Username**: `admin`
- **Password**: `ChangeMeInProduction` (change this in grafana-deployment.yaml)

Prometheus is already pre-configured as a data source. You can create dashboards to visualize:
- HTTP requests per second
- Response time percentiles (p50, p95, p99)
- Active WebSocket connections
- Pod CPU and memory usage

---

## Troubleshooting

### Pods not starting?

```bash
# Check pod events (shows error messages)
kubectl describe pod <pod-name> -n production

# Check pod logs
kubectl logs <pod-name> -n production

# Common causes:
# - Wrong ECR image URL (check YOUR_AWS_ACCOUNT_ID was replaced)
# - Secret not created (check kubectl get secret mbm-secrets -n production)
# - Backend can't connect to MongoDB (check MONGO_URI in secret)
```

### CORS errors in browser?

```bash
# Check FRONTEND_URL in the configmap matches your actual domain
kubectl get configmap mbm-config -n production -o yaml

# Check backend is reading it correctly
kubectl logs deployment/mbm-backend -n production | grep "Allowed CORS"
```

### Ingress not getting an address?

```bash
# Check ALB controller is installed
kubectl get deployment -n kube-system aws-load-balancer-controller

# Check ALB controller logs for errors
kubectl logs -n kube-system deployment/aws-load-balancer-controller
```

### Rolling back a bad deployment?

```bash
# Immediately roll back backend to previous version
kubectl rollout undo deployment/mbm-backend -n production

# Roll back frontend
kubectl rollout undo deployment/mbm-frontend -n production

# Check rollback status
kubectl rollout status deployment/mbm-backend -n production
```

---

## Cost Estimation (AWS Free Tier)

| Service | Free Tier | After Free Tier |
|---------|-----------|----------------|
| EKS Control Plane | ❌ Not free | $0.10/hour (~$72/month) |
| EC2 t3.micro (2 nodes) | ✅ 750 hours/month | ~$15/month each |
| ECR | ✅ 500MB free | $0.10/GB |
| ALB | ❌ Not free | ~$16/month |
| **Total estimate** | | **~$100-120/month** |

> **For student projects**: Consider deploying only when needed, and destroying the cluster after presentations to save cost. The cluster itself (`eks control plane`) costs $0.10/hour regardless of usage.
