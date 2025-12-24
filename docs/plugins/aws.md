# AWS Plugin

AWS integration providing authentication status and S3 interaction capabilities.

## Overview

The `@tokenring-ai/aws` package provides AWS integration within the Token Ring ecosystem. It enables authentication verification, account information retrieval, and basic S3 bucket operations. The plugin integrates with the agent system through services, tools, and chat commands.

## Key Features

- **AWS Authentication**: Verify AWS credentials and region configuration
- **Account Information**: Retrieve caller identity details (ARN, Account ID, User ID)
- **S3 Operations**: List S3 buckets in the configured AWS account
- **Service Management**: AWS service with proper initialization and status reporting
- **Chat Commands**: Interactive AWS status command
- **Tool Integration**: AWS tools for programmatic access

## Core Components

### AWSService

Central AWS service that handles client initialization and authentication.

**Key Methods:**
- `getCallerIdentity()`: Retrieves AWS caller identity information
- `isAuthenticated()`: Checks if AWS credentials are configured
- `getStatus()`: Returns service status and account information
- `getSTSClient()`: Provides STS client for authentication operations
- `getS3Client()`: Provides S3 client for bucket operations

**Authentication:**
- Requires AWS Access Key ID, Secret Access Key, and region
- Optional session token for temporary credentials
- Verifies credentials on service initialization

### Tools

**aws_listS3Buckets**: Lists all S3 buckets in the configured AWS account

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
import { aws_listS3Buckets } from '@tokenring-ai/aws/tools/azure_listS3Buckets';

const result = await agent.executeTool('aws_listS3Buckets', {});
console.log(result.buckets);
```

### Chat Commands

**/aws status**: Displays current AWS authentication status and account information

**Output Format:**
```
AWS Authentication Status:
  Account: 123456789012
  Arn: arn:aws:iam::123456789012:user/example-user
  UserId: AIDAEXAMPLEUSERID
  Region: us-east-1
```

## Usage Examples

### Basic AWS Status Command

```bash
/aws status
```

**Example Output:**
```
AWS Authentication Status:
  Account: 123456789012
  Arn: arn:aws:iam::123456789012:user/example-user
  UserId: AIDAEXAMPLEUSERID
  Region: us-east-1
```

### List S3 Buckets via Tool

```typescript
import { aws_listS3Buckets } from '@tokenring-ai/aws/tools/azure_listS3Buckets';

const result = await agent.executeTool('aws_listS3Buckets', {});
console.log('S3 Buckets:', result.buckets);
```

**Example Output:**
```json
{
  "buckets": [
    { "Name": "example-bucket-1", "CreationDate": "2023-01-15T10:30:00Z" },
    { "Name": "example-bucket-2", "CreationDate": "2023-02-20T14:45:00Z" }
  ]
}
```

### Direct Service Usage

```typescript
import { AWSService } from '@tokenring-ai/aws';

const awsService = new AWSService({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

// Check authentication
if (awsService.isAuthenticated()) {
  const identity = await awsService.getCallerIdentity();
  console.log('AWS Account:', identity.Account);
}
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
