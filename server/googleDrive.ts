import { google, drive_v3 } from 'googleapis';
import { env } from "./config";
import { logger } from "./logger";
import { Readable } from 'stream';

// Cache for Google Drive client
let cachedDriveClient: drive_v3.Drive | null = null;
let cacheExpiry: number = 0;

const BACKUP_FOLDER_NAME = 'نظام إدارة الموردين - نسخ احتياطية';
const MANAGED_BY = 'عمار محمد';

/**
 * Get Google Drive client using one of the following methods:
 * 1. Service Account (GOOGLE_SERVICE_ACCOUNT_KEY)
 * 2. OAuth2 with refresh token (GOOGLE_DRIVE_REFRESH_TOKEN)
 * 3. Replit Connectors (for Replit environment)
 */
async function getGoogleDriveClient(): Promise<drive_v3.Drive> {
  // Return cached client if still valid
  if (cachedDriveClient && Date.now() < cacheExpiry) {
    return cachedDriveClient;
  }

  // Method 1: Service Account (preferred for server-to-server)
  if (env.GOOGLE_SERVICE_ACCOUNT_KEY) {
    try {
      const serviceAccountKey = JSON.parse(env.GOOGLE_SERVICE_ACCOUNT_KEY);
      const auth = new google.auth.GoogleAuth({
        credentials: serviceAccountKey,
        scopes: ['https://www.googleapis.com/auth/drive.file'],
      });
      cachedDriveClient = google.drive({ version: 'v3', auth });
      cacheExpiry = Date.now() + 50 * 60 * 1000; // Cache for 50 minutes
      logger.info('Google Drive connected via Service Account');
      return cachedDriveClient;
    } catch (error) {
      logger.error({ err: error }, 'Failed to initialize Service Account');
    }
  }

  // Method 2: OAuth2 with Refresh Token
  if (env.GOOGLE_DRIVE_REFRESH_TOKEN && env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) {
    try {
      const oauth2Client = new google.auth.OAuth2(
        env.GOOGLE_CLIENT_ID,
        env.GOOGLE_CLIENT_SECRET
      );
      oauth2Client.setCredentials({
        refresh_token: env.GOOGLE_DRIVE_REFRESH_TOKEN,
      });
      cachedDriveClient = google.drive({ version: 'v3', auth: oauth2Client });
      cacheExpiry = Date.now() + 50 * 60 * 1000;
      logger.info('Google Drive connected via OAuth2 Refresh Token');
      return cachedDriveClient;
    } catch (error) {
      logger.error({ err: error }, 'Failed to initialize OAuth2');
    }
  }

  // Method 3: Replit Connectors (for Replit environment)
  if (env.REPLIT_CONNECTORS_HOSTNAME) {
    try {
      const accessToken = await getReplitAccessToken();
      const oauth2Client = new google.auth.OAuth2();
      oauth2Client.setCredentials({ access_token: accessToken });
      cachedDriveClient = google.drive({ version: 'v3', auth: oauth2Client });
      cacheExpiry = Date.now() + 30 * 60 * 1000; // Shorter cache for Replit tokens
      logger.info('Google Drive connected via Replit Connectors');
      return cachedDriveClient;
    } catch (error) {
      logger.error({ err: error }, 'Failed to connect via Replit Connectors');
    }
  }

  throw new Error('Google Drive not configured. Please set GOOGLE_SERVICE_ACCOUNT_KEY or GOOGLE_DRIVE_REFRESH_TOKEN');
}

// Replit Connectors token retrieval
let replitConnectionSettings: any = null;

async function getReplitAccessToken(): Promise<string> {
  if (replitConnectionSettings?.settings?.expires_at && 
      new Date(replitConnectionSettings.settings.expires_at).getTime() > Date.now()) {
    return replitConnectionSettings.settings.access_token;
  }
  
  const hostname = env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = env.REPL_IDENTITY 
    ? 'repl ' + env.REPL_IDENTITY 
    : env.WEB_REPL_RENEWAL 
    ? 'depl ' + env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('Replit token not found');
  }

  replitConnectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=google-drive',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  const accessToken = replitConnectionSettings?.settings?.access_token || 
                      replitConnectionSettings?.settings?.oauth?.credentials?.access_token;

  if (!accessToken) {
    throw new Error('Google Drive not connected in Replit');
  }
  return accessToken;
}

async function getOrCreateBackupFolder(): Promise<string> {
  const drive = await getGoogleDriveClient();
  
  const response = await drive.files.list({
    q: `name='${BACKUP_FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    fields: 'files(id, name)',
  });

  if (response.data.files && response.data.files.length > 0) {
    return response.data.files[0].id!;
  }

  const folderMetadata = {
    name: BACKUP_FOLDER_NAME,
    mimeType: 'application/vnd.google-apps.folder',
    description: `مجلد النسخ الاحتياطية - إدارة: ${MANAGED_BY}`,
  };

  const folder = await drive.files.create({
    requestBody: folderMetadata,
    fields: 'id',
  });

  return folder.data.id!;
}

export async function uploadBackupToGoogleDrive(data: {
  suppliers: any[];
  transactions: any[];
  users: any[];
}, createdBy?: { id: string; name: string; email?: string }) {
  const drive = await getGoogleDriveClient();
  const folderId = await getOrCreateBackupFolder();
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFileName = `نسخة_احتياطية_${timestamp}.json`;
  
  const creatorInfo = createdBy ? {
    userId: createdBy.id,
    userName: createdBy.name,
    userEmail: createdBy.email,
  } : {
    managedBy: MANAGED_BY,
  };
  
  const backupContent = JSON.stringify({
    metadata: {
      createdAt: new Date().toISOString(),
      ...creatorInfo,
      version: '1.0',
      totalSuppliers: data.suppliers.length,
      totalTransactions: data.transactions.length,
      totalUsers: data.users.length,
    },
    data: data,
  }, null, 2);

  const fileMetadata = {
    name: backupFileName,
    parents: [folderId],
    description: `نسخة احتياطية من نظام إدارة الموردين - ${new Date().toLocaleDateString('ar-IQ')}`,
  };

  // Convert string to readable stream
  const stream = Readable.from([backupContent]);

  const file = await drive.files.create({
    requestBody: fileMetadata,
    media: {
      mimeType: 'application/json',
      body: stream,
    },
    fields: 'id, name, createdTime, webViewLink',
  });

  return {
    success: true,
    fileId: file.data.id,
    fileName: file.data.name,
    createdTime: file.data.createdTime,
    webViewLink: file.data.webViewLink,
  };
}

export async function listBackups() {
  const drive = await getGoogleDriveClient();
  const folderId = await getOrCreateBackupFolder();

  const response = await drive.files.list({
    q: `'${folderId}' in parents and trashed=false`,
    fields: 'files(id, name, createdTime, size, webViewLink)',
    orderBy: 'createdTime desc',
    pageSize: 20,
  });

  return {
    backups: response.data.files || [],
    folderId: folderId,
    managedBy: MANAGED_BY,
  };
}

export async function downloadBackup(fileId: string) {
  const drive = await getGoogleDriveClient();

  const response = await drive.files.get({
    fileId: fileId,
    alt: 'media',
  });

  return response.data;
}

export async function deleteBackup(fileId: string) {
  const drive = await getGoogleDriveClient();

  await drive.files.delete({
    fileId: fileId,
  });

  logger.info({ fileId }, 'Backup deleted successfully');
  return { success: true };
}

export async function checkGoogleDriveConnection() {
  try {
    const drive = await getGoogleDriveClient();
    const about = await drive.about.get({ fields: 'user' });
    return {
      connected: true,
      user: about.data.user,
      managedBy: MANAGED_BY,
    };
  } catch (error: any) {
    logger.error({ err: error }, 'Google Drive connection check failed');
    return {
      connected: false,
      error: error.message || 'Google Drive غير متصل',
      managedBy: MANAGED_BY,
    };
  }
}
