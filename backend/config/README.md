# Google Cloud Vision API Credentials

## Setup Instructions

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com

2. **Create a Project** (if you don't have one)
   - Click "Select a project" → "New Project"
   - Name it: "budget-analyzer-receipt-scanner"

3. **Enable Cloud Vision API**
   - Go to: APIs & Services → Library
   - Search for "Cloud Vision API"
   - Click "Enable"

4. **Enable Billing**
   - Go to: Billing
   - Link a billing account (required even for free tier)
   - First 1,000 requests/month are FREE

5. **Create Service Account**
   - Go to: IAM & Admin → Service Accounts
   - Click "Create Service Account"
   - Name: "receipt-scanner-service"
   - Grant role: "Cloud Vision API User"

6. **Download Credentials**
   - Click on the service account
   - Go to "Keys" tab
   - Click "Add Key" → "Create New Key" → "JSON"
   - Download the JSON file

7. **Save Credentials**
   - Rename the downloaded file to: `google-vision-key.json`
   - Move it to: `backend/config/google-vision-key.json`
   - **DO NOT commit this file to git!** (It's already in .gitignore)

## Sharing with Team

**The google-vision-key.json file contains sensitive credentials.**

To share with teammates:
- Use a secure password manager (1Password, LastPass)
- Send via encrypted messaging (Signal)
- Share the Google Cloud project access instead (they can download their own key)

**Never commit the actual credentials to git!**

## Verification

After setup, verify the file exists:
```bash
ls -la backend/config/google-vision-key.json
```

You should see a JSON file ~2-3KB in size.
