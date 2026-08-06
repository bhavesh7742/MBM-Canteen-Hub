#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════════
# MBM Canteen Hub — AWS Setup Script (No Terraform)
# ═══════════════════════════════════════════════════════════════════════════════
#
# What this script does:
#   1. Creates two ECR repositories (backend + frontend)
#   2. Creates an IAM user for GitHub Actions with ECR + EKS permissions
#   3. Creates an EKS cluster and node group (EC2 worker nodes)
#   4. Connects kubectl to the EKS cluster
#
# Prerequisites:
#   - AWS CLI installed: brew install awscli / winget install Amazon.AWSCLI
#   - eksctl installed: brew install eksctl / winget install eksctl.eksctl
#   - kubectl installed: brew install kubectl
#   - AWS CLI configured: aws configure (enter your Access Key ID + Secret)
#
# Usage:
#   chmod +x scripts/aws-setup.sh
#   ./scripts/aws-setup.sh
#
# ═══════════════════════════════════════════════════════════════════════════════

set -e  # Exit immediately if any command fails

# ─────────────────────────────────────────────
# CONFIGURATION — Edit these before running
# ─────────────────────────────────────────────
AWS_REGION="ap-south-1"           # Mumbai — change to your region
CLUSTER_NAME="mbm-canteen-cluster"
NODE_TYPE="t3.micro"              # Free tier eligible
NODE_COUNT=2                       # Start with 2 nodes
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

echo "════════════════════════════════════════════════"
echo "  MBM Canteen Hub — AWS Infrastructure Setup"
echo "════════════════════════════════════════════════"
echo "AWS Account ID : $ACCOUNT_ID"
echo "AWS Region     : $AWS_REGION"
echo "EKS Cluster    : $CLUSTER_NAME"
echo "Node Type      : $NODE_TYPE"
echo "Node Count     : $NODE_COUNT"
echo ""

# ─────────────────────────────────────────────
# STEP 1: Create ECR Repositories
# ─────────────────────────────────────────────
# ECR = Elastic Container Registry
# Amazon's private Docker registry — stores your built Docker images
# Like DockerHub but private and integrated with AWS permissions

echo "📦 Step 1: Creating ECR repositories..."

# Create backend repository
aws ecr create-repository \
    --repository-name mbm-canteen-backend \
    --region $AWS_REGION \
    --image-scanning-configuration scanOnPush=true \
    --query 'repository.repositoryUri' \
    --output text 2>/dev/null || echo "  → Backend repository already exists"

# Create frontend repository
aws ecr create-repository \
    --repository-name mbm-canteen-frontend \
    --region $AWS_REGION \
    --image-scanning-configuration scanOnPush=true \
    --query 'repository.repositoryUri' \
    --output text 2>/dev/null || echo "  → Frontend repository already exists"

echo "✅ ECR repositories ready"
echo ""

# ─────────────────────────────────────────────
# STEP 2: Create IAM User for GitHub Actions
# ─────────────────────────────────────────────
# GitHub Actions needs AWS credentials to:
# 1. Push Docker images to ECR
# 2. Deploy to EKS (update Kubernetes deployments)
#
# We create a dedicated IAM user with ONLY the permissions it needs
# (Principle of Least Privilege — a security best practice)

echo "🔐 Step 2: Creating IAM user for GitHub Actions..."

IAM_USER="mbm-github-actions"

# Create the IAM user
aws iam create-user --user-name $IAM_USER 2>/dev/null || \
    echo "  → IAM user already exists"

# Create an IAM policy with the minimum required permissions
cat > /tmp/mbm-github-policy.json << 'EOF'
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "ECRAccess",
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
            "Sid": "EKSAccess",
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

# Create the policy in AWS
POLICY_ARN=$(aws iam create-policy \
    --policy-name MBMGitHubActionsPolicy \
    --policy-document file:///tmp/mbm-github-policy.json \
    --query 'Policy.Arn' \
    --output text 2>/dev/null) || \
    POLICY_ARN="arn:aws:iam::${ACCOUNT_ID}:policy/MBMGitHubActionsPolicy"

# Attach the policy to the IAM user
aws iam attach-user-policy \
    --user-name $IAM_USER \
    --policy-arn $POLICY_ARN 2>/dev/null || true

# Create Access Keys for the IAM user
# These go into GitHub Secrets: AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY
echo ""
echo "🔑 Creating Access Keys for GitHub Actions..."
echo "   IMPORTANT: Save these — you can only see the Secret once!"
echo ""

aws iam create-access-key \
    --user-name $IAM_USER \
    --query 'AccessKey.[AccessKeyId,SecretAccessKey]' \
    --output table 2>/dev/null || \
    echo "  → Access key already exists for this user"

echo ""
echo "✅ IAM user configured"
echo ""

# ─────────────────────────────────────────────
# STEP 3: Create EKS Cluster
# ─────────────────────────────────────────────
# EKS = Elastic Kubernetes Service
# Amazon's managed Kubernetes — AWS handles the control plane for you
# You only manage the worker nodes (EC2 instances that run your pods)
#
# eksctl is a CLI tool that simplifies EKS cluster creation
# It creates: EKS cluster, VPC, subnets, security groups, node group

echo "☸️  Step 3: Creating EKS cluster..."
echo "   This takes 15-20 minutes. Get a coffee ☕"
echo ""

eksctl create cluster \
    --name $CLUSTER_NAME \
    --region $AWS_REGION \
    --version 1.31 \
    --nodegroup-name mbm-nodes \
    --node-type $NODE_TYPE \
    --nodes $NODE_COUNT \
    --nodes-min 1 \
    --nodes-max 3 \
    --managed \
    --asg-access \
    --with-oidc \
    --alb-ingress-access

echo ""
echo "✅ EKS cluster created"
echo ""

# ─────────────────────────────────────────────
# STEP 4: Connect kubectl to EKS
# ─────────────────────────────────────────────
# kubectl needs a configuration file (~/.kube/config) to know:
# - Which Kubernetes cluster to talk to
# - How to authenticate
# This command adds your EKS cluster to that config file

echo "🔗 Step 4: Connecting kubectl to EKS..."
aws eks update-kubeconfig \
    --name $CLUSTER_NAME \
    --region $AWS_REGION

echo ""
echo "✅ kubectl connected to EKS"
echo ""

# ─────────────────────────────────────────────
# STEP 5: Verify everything is working
# ─────────────────────────────────────────────
echo "🔍 Step 5: Verification..."
echo ""
echo "Worker nodes:"
kubectl get nodes
echo ""

# ─────────────────────────────────────────────
# STEP 6: Install AWS Load Balancer Controller
# ─────────────────────────────────────────────
# The ALB controller watches for Ingress resources and
# automatically creates Application Load Balancers in AWS
# Without this, the ingress.yaml won't create an ALB

echo "⚙️  Step 6: Installing AWS Load Balancer Controller..."

# Download the IAM policy for ALB controller
curl -O https://raw.githubusercontent.com/kubernetes-sigs/aws-load-balancer-controller/v2.7.0/docs/install/iam_policy.json

# Create the IAM policy
aws iam create-policy \
    --policy-name AWSLoadBalancerControllerIAMPolicy \
    --policy-document file://iam_policy.json 2>/dev/null || \
    echo "  → Policy already exists"

# Create service account for ALB controller
eksctl create iamserviceaccount \
    --cluster=$CLUSTER_NAME \
    --namespace=kube-system \
    --name=aws-load-balancer-controller \
    --role-name AmazonEKSLoadBalancerControllerRole \
    --attach-policy-arn=arn:aws:iam::${ACCOUNT_ID}:policy/AWSLoadBalancerControllerIAMPolicy \
    --approve \
    --region=$AWS_REGION 2>/dev/null || true

# Install ALB controller using Helm
helm repo add eks https://aws.github.io/eks-charts
helm repo update eks
helm install aws-load-balancer-controller eks/aws-load-balancer-controller \
    -n kube-system \
    --set clusterName=$CLUSTER_NAME \
    --set serviceAccount.create=false \
    --set serviceAccount.name=aws-load-balancer-controller \
    2>/dev/null || echo "  → ALB controller already installed"

rm -f iam_policy.json

echo ""
echo "✅ ALB Controller installed"
echo ""

# ─────────────────────────────────────────────
# SUMMARY
# ─────────────────────────────────────────────
echo "════════════════════════════════════════════════"
echo "✅ AWS Infrastructure Setup Complete!"
echo "════════════════════════════════════════════════"
echo ""
echo "ECR Repositories:"
echo "  Backend  → ${ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/mbm-canteen-backend"
echo "  Frontend → ${ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/mbm-canteen-frontend"
echo ""
echo "Next steps:"
echo "  1. Copy the AWS Access Keys above → GitHub Settings → Secrets"
echo "     - AWS_ACCESS_KEY_ID"
echo "     - AWS_SECRET_ACCESS_KEY"
echo "     - AWS_ACCOUNT_ID = $ACCOUNT_ID"
echo "     - VITE_API_URL = https://your-api-domain.com"
echo ""
echo "  2. Create the Kubernetes namespace and secrets:"
echo "     kubectl apply -f k8s/production/namespace.yaml"
echo "     kubectl create secret generic mbm-secrets \\"
echo "       --from-literal=mongo-uri='your_mongodb_uri' \\"
echo "       --from-literal=jwt-secret='your_jwt_secret' \\"
echo "       -n production"
echo ""
echo "  3. Update YOUR_AWS_ACCOUNT_ID in:"
echo "     - k8s/production/backend-deployment.yaml"
echo "     - k8s/production/frontend-deployment.yaml"
echo "     Replace with: $ACCOUNT_ID"
echo ""
echo "  4. Update mbmcanteen.local.com in:"
echo "     - k8s/production/ingress.yaml"
echo "     - k8s/production/configmap.yaml"
echo ""
echo "  5. Deploy everything:"
echo "     kubectl apply -f k8s/production/"
echo "     kubectl apply -f k8s/monitoring/"
echo ""
echo "  6. Push to GitHub main branch to trigger the CI/CD pipeline"
