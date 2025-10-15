# AWS Plugin

AWS integration for authentication with STS and basic S3 operations.

## Overview

The `@tokenring-ai/aws` package provides AWS integration for TokenRing AI agents. It enables authentication with AWS services using STS (Security Token Service) and basic interaction with S3, such as listing buckets. The package is designed as a `TokenRingService` that can be injected into agents, supporting startup authentication checks, status reporting, and tools/commands for agent workflows.

## Key Features

- AWS STS authentication and identity verification
- S3 bucket listing and management
- Service status reporting
- Chat commands for AWS operations
- Secure credential handling

## Core Components

### AWSService

Main class that handles AWS SDK clients and authentication.

**Key Methods:**
- `constructor(credentials)`: Initializes with `accessKeyId`, `secretAccessKey`, optional `sessionToken`, and `region`
- `initializeAWSClient<T>(ClientClass, clientConfig?)`: Generic method to create AWS SDK clients
- `getSTSClient()`: Returns or creates STS client
- `getS3Client()`: Returns or creates S3 client
- `isAuthenticated()`: Checks if credentials and region are set
- `getCallerIdentity()`: Retrieves AWS account details via STS
- `start(agentTeam)`: Starts the service, logs authentication status
- `status(agent)`: Reports service status including authentication and account info

### Tools

**listS3Buckets**: Lists all S3 buckets in the configured account
- Input: None
- Returns: `{ buckets: Array<{ Name: string; CreationDate: string }> }`

### Chat Commands

**aws status**: Displays account, ARN, UserId, and region information

## Usage Example

```typescript
import AWSService from '@tokenring-ai/aws';
import { AgentTeam } from '@tokenring-ai/agent';

const awsService = new AWSService({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: 'us-east-1'
});

const agentTeam = new AgentTeam();
agentTeam.addService(awsService);

await awsService.start(agentTeam);
const identity = await awsService.getCallerIdentity();
console.log(`Account: ${identity.Account}`);
```

## Configuration Options

- `accessKeyId` (string, required): AWS Access Key ID
- `secretAccessKey` (string, required): AWS Secret Access Key
- `sessionToken` (string, optional): For temporary credentials
- `region` (string, required): AWS region (e.g., 'us-east-1')

## Dependencies

- `@aws-sdk/client-s3@^3.864.0`: For S3 operations
- `@aws-sdk/client-sts@^3.864.0`: For authentication checks
- `@tokenring-ai/agent`: Core agent framework
- `zod@^4.0.17`: Schema validation
