const baseUrl = process.env.API_URL || 'http://127.0.0.1:4000';

async function main() {
  const response = await fetch(`${baseUrl}/api/health`);
  const body = await response.json();

  if (!response.ok || !body.success) {
    console.error('Health check failed:', body);
    process.exit(1);
  }

  console.log('Health check OK:', JSON.stringify(body.data, null, 2));
}

main().catch((error) => {
  console.error('Health check error:', error.message);
  process.exit(1);
});
