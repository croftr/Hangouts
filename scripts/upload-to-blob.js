const { put } = require('@vercel/blob');
const { readFileSync } = require('fs');
const { join } = require('path');

async function uploadDatabase() {
  const token = process.env.BLOB_READ_WRITE_TOKEN;

  if (!token) {
    console.error('Error: BLOB_READ_WRITE_TOKEN environment variable is not set');
    console.log('\nTo get your token:');
    console.log('1. Go to https://vercel.com/dashboard');
    console.log('2. Select your project');
    console.log('3. Go to Storage tab');
    console.log('4. Create a Blob store if you haven\'t already');
    console.log('5. Copy the BLOB_READ_WRITE_TOKEN from the .env.local tab');
    console.log('6. Set it in your environment: export BLOB_READ_WRITE_TOKEN=your_token');
    process.exit(1);
  }

  try {
    const dbPath = join(process.cwd(), 'messages.db');
    const fileBuffer = readFileSync(dbPath);

    console.log('Uploading database to Vercel Blob...');
    console.log(`File size: ${(fileBuffer.length / 1024 / 1024).toFixed(2)} MB`);

    const blob = await put('messages.db', fileBuffer, {
      access: 'public',
      token,
    });

    console.log('\n✅ Upload successful!');
    console.log('\nBlob URL:', blob.url);
    console.log('\nNext steps:');
    console.log('1. Add this environment variable to your Vercel project:');
    console.log(`   DATABASE_BLOB_URL=${blob.url}`);
    console.log('\n2. Also add your BLOB_READ_WRITE_TOKEN to Vercel environment variables');
    console.log('\n3. Redeploy your application');
  } catch (error) {
    console.error('Upload failed:', error.message);
    process.exit(1);
  }
}

uploadDatabase();
