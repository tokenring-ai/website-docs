# AWS Plugin

AWS integration providing authentication status and S3 interaction capabilities.

## Overview

The `@tokenring-ai/aws` package provides AWS integration within the Token Ring ecosystem. It enables secure authentication with AWS services using STS (Security Token Service) and provides tools for basic AWS operations like listing S3 buckets. The plugin integrates seamlessly with the TokenRing AI framework through services, tools, and chat commands.

This package focuses on secure credential handling and client initialization for AWS SDK v3, allowing agents to perform AWS operations like querying account identity and managing S3 resources.

## Key Features

- **Secure AWS Authentication**: Uses AWS SDK v3 with proper credential management
- **S3 Bucket Listing**: Provides a tool to list all S3 buckets in the configured account
- **Account Identity**: Retrieves AWS account information via STS
- **Plugin Architecture**: Integrates with TokenRing application framework
- **Service Status**: Provides authentication status and account information
- **Chat Commands**: Interactive AWS commands for status checking
- **Generic Client Initialization**: Supports initialization of any AWS SDK client

## Core Components

### AWSService

The main service class that handles AWS SDK clients and authentication.

**Constructor Properties:**
- `accessKeyId` (string, required): AWS Access Key ID
- `secretAccessKey` (string, required): AWS Secret Access Key  
- `sessionToken` (string, optional): AWS Session Token for temporary credentials
- `region` (string, required): AWS region (e.g., 'us-east-1')

**Key Methods:**
- `initializeAWSClient<T>(ClientClass, clientConfig)`: Initializes any AWS SDK client
- `getSTSClient()`: Returns or creates an STS client
- `getS3Client()`: Returns or creates an S3 client
- `isAuthenticated()`: Checks if credentials and region are configured
- `getCallerIdentity()`: Retrieves AWS account identity via STS
- `run(signal)`: Service startup with authentication check
- `status(agent)`: Returns service status and account information

### Available Tools

#### aws_listS3Buckets

Lists all S3 buckets in the configured AWS account and region.

**Tool Name:** `aws_listS3Buckets`

**Description:** "Lists all S3 buckets in the configured AWS account and region."

**Input Schema:**
```typescript
z.object({}) // No parameters required
```

**Returns:**
```typescript
{
  buckets: Array<{
    Name: string;
    CreationDate: string;
  }>;
}
```

**Usage:**
```typescript
import { TokenRingApp } from "@tokenring-ai/app";
import awsPlugin from "@tokenring-ai/aws";

const app = new TokenRingApp({
  plugins: [awsPlugin]
});

const agent = app.createAgent();
const result = await agent.executeTool("aws_listS3Buckets", {});
console.log('S3 Buckets:', result.buckets);
```

### Chat Commands

#### /aws status

Provides chat-based commands for AWS status checks.

**Available Commands:**
- `status`: View current AWS authentication status and account information

**Usage Example:**
```
> aws status
AWS Authentication Status:
  Account: 123456789012
  Arn: arn:aws:iam::123456789012:user/example
  UserId: AIDAEXAMPLEUSER
  Region: us-east-1
```

## Usage Examples

### 1. Basic Service Usage

```typescript
import AWSService from "@tokenring-ai/aws";

const awsService = new AWSService({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  region: process.env.AWS_REGION || 'us-east-1'
});

// Check authentication status
if (awsService.isAuthenticated()) {
  const identity = await awsService.getCallerIdentity();
  console.log(`Account: ${identity.Account}`);
  console.log(`ARN: ${identity.Arn}`);
}
```

### 2. Using S3 Client

```typescript
import { ListBucketsCommand } from "@aws-sdk/client-s3";
import AWSService from "@tokenring-ai/aws";

const awsService = new AWSService({
  accessKeyId: "your-access-key",
  secretAccessKey: "your-secret-key",
  region: "us-east-1"
});

const s3Client = awsService.getS3Client();
const command = new ListBucketsCommand({});
const response = await s3Client.send(command);
console.log('S3 Buckets:', response.Buckets);
```

### 3. Generic AWS Client Initialization

```typescript
import { SNSClient } from "@aws-sdk/client-sns";
import AWSService from "@tokenring-ai/aws";

const awsService = new AWSService({
  // ... credentials
});

const snsClient = awsService.initializeAWSClient(SNSClient, {
  // Additional SNS-specific configuration
});
```

### 4. Using the S3 Buckets Tool

```typescript
import { TokenRingApp } from "@tokenring-ai/app";
import awsPlugin from "@tokenring-ai/aws";

const app = new TokenRingApp({
  plugins: [awsPlugin]
});

const agent = app.createAgent();
const result = await agent.executeTool("aws_listS3Buckets", {});
console.log('S3 Buckets:', result.buckets);
```

### 5. Using AWS Chat Commands

```typescript
import { TokenRingApp } from "@tokenring-ai/app";
import awsPlugin from "@tokenring-ai/aws";

const app = new TokenRingApp({
  plugins: [awsPlugin]
});

const agent = app.createAgent();
const result = await agent.executeCommand("aws status");
// The result will be displayed in the agent's chat output
```

## API Reference

### AWSService

```typescript
class AWSService implements TokenRingService {
  constructor(credentials: AWSCredentials)
  initializeAWSClient<T>(ClientClass: new (config: {
    region: string;
    credentials: { accessKeyId: string; secretAccessKey: string; sessionToken?: string }
  } & Record<string, unknown>) => T, clientConfig?: Record<string, unknown>): T
  getSTSClient(): STSClient
  getS3Client(): S3Client
  isAuthenticated(): boolean
  async getCallerIdentity(): Promise<{ Arn?: string; Account?: string; UserId?: string }>
  async run(signal: AbortSignal): Promise<void>
  async status(agent: Agent): Promise<{
    active: boolean;
    service: string;
    authenticated: boolean;
    accountInfo?: { Arn?: string; Account?: string; UserId?: string }
    error?: string;
  }>
}
```

### AWSCredentials Interface

```typescript
interface AWSCredentials {
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken?: string;
  region: string;
}
```

### Plugin Configuration

```typescript
export const AWSConfigSchema = z.any().optional();

export default {
  name: "@tokenring-ai/aws",
  version: "0.2.0",
  description: "AWS integration providing authentication status and S3 interaction",
  install(app: TokenRingApp): void
} satisfies TokenRingPlugin
```

## Configuration Options

### Environment Variables

- `AWS_ACCESS_KEY_ID`: Your AWS Access Key ID
- `AWS_SECRET_ACCESS_KEY`: Your AWS Secret Access Key  
- `AWS_REGION`: Your AWS region (e.g., 'us-east-1')
- `AWS_SESSION_TOKEN`: Optional session token for temporary credentials

### Configuration Schema

```typescript
interface AWSCredentials {
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken?: string;
  region: string;
}
```

### Configuration Requirements

- **Required**: `accessKeyId`, `secretAccessKey`, `region`
- **Optional**: `sessionToken` (for temporary credentials)

## Authentication Flow

1. **Service Initialization**: AWS credentials and region are provided
2. **Client Setup**: STS and S3 clients are initialized with credentials
3. **Authentication Check**: Credentials are verified during service startup
4. **Status Reporting**: Caller identity is retrieved and reported
5. **Tool Access**: Tools can only execute if authentication is successful

## Dependencies

- `@tokenring-ai/agent`: Core agent framework
- `@tokenring-ai/app`: Application framework
- `@tokenring-ai/chat`: Chat and tool integration
- `@aws-sdk/client-s3@^3.952.0`: S3 client for bucket operations
- `@aws-sdk/client-sts@^3.952.0`: STS client for authentication
- `@tokenring-ai/filesystem`: Filesystem utilities

## Error Handling

### Common Errors

- **Credentials Not Configured**: AWS credentials missing or invalid
- **Authentication Failure**: Invalid credentials or permissions issues
- **Service Unavailable**: AWS service temporary unavailability
- **Region Mismatch**: Region configuration issues

### Error Recovery

1. Verify AWS credentials are correct
2. Check IAM permissions for STS GetCallerIdentity and S3 ListBuckets
3. Ensure region configuration matches the AWS account region
4. Check network connectivity to AWS services

## Integration Patterns

### Service Registration

```typescript
import { TokenRingApp } from '@tokenring-ai/app';
import awsPlugin from '@tokenring-ai/aws';

const app = new TokenRingApp();
app.use(awsPlugin);
```

### Tool Usage

Tools are automatically registered with the chat system when the AWS plugin is installed.

### Command Access

Chat commands are available through the `/aws` prefix in interactive sessions.

## Security Considerations

- Store AWS credentials securely using environment variables
- Use least privilege principle for IAM permissions
- Consider temporary credentials for enhanced security
- Monitor API usage and set appropriate quotas

## Performance Considerations

- AWS client initialization is lazy (on-demand)
- STS and S3 clients are cached after first creation
- Authentication checks occur during service startup
- Tool executions use existing client connections

## Troubleshooting

### Common Issues

1. **Authentication Failed**: Check credentials and IAM permissions
2. **No S3 Buckets Listed**: Verify S3 ListBuckets permissions
3. **Region Mismatch**: Ensure region configuration matches AWS account
4. **Network Issues**: Check connectivity to AWS endpoints

### Debugging Tips

- Enable AWS SDK debug logging for detailed error information
- Verify IAM policy allows necessary permissions
- Check AWS service status for temporary outages
- Validate region configuration matches the AWS account region