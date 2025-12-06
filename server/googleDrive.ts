import { google } from 'googleapis';
import { env } from "./config";

let connectionSettings: any;

async function getAccessToken() {
  if (connectionSettings && connectionSettings.settings.expires_at && new Date(connectionSettings.settings.expires_at).getTime() > Date.now()) {
    return connectionSettings.settings.access_token;
  }
  
  const hostname = env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = env.REPL_IDENTITY 
    ? 'repl ' + env.REPL_IDENTITY 
    : env.WEB_REPL_RENEWAL 
    ? 'depl ' + env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=google-drive',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  const accessToken = connectionSettings?.settings?.access_token || connectionSettings.settings?.oauth?.credentials?.access_token;

  if (!connectionSettings || !accessToken) {
    throw new Error('Google Drive not connected');
  }
  return accessToken;
}

async function getUncachableGoogleDriveClient() {
  const accessToken = await getAccessToken();

  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({
    access_token: accessToken
  });

  return google.drive({ version: 'v3', auth: oauth2Client });
}

const BACKUP_FOLDER_NAME = 'نظام إدارة الموردين - نسخ احتياطية';
const MANAGED_BY = 'عمار محمد';

async function getOrCreateBackupFolder() {
  const drive = await getUncachableGoogleDriveClient();
  
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
  const drive = await getUncachableGoogleDriveClient();
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

  const media = {
    mimeType: 'application/json',
    body: backupContent,
  };

  const file = await drive.files.create({
    requestBody: fileMetadata,
    media: media,
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
  const drive = await getUncachableGoogleDriveClient();
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
  const drive = await getUncachableGoogleDriveClient();

  const response = await drive.files.get({
    fileId: fileId,
    alt: 'media',
  });

  return response.data;
}

export async function deleteBackup(fileId: string) {
  const drive = await getUncachableGoogleDriveClient();

  await drive.files.delete({
    fileId: fileId,
  });

  return { success: true };
}

export async function checkGoogleDriveConnection() {
  try {
    const drive = await getUncachableGoogleDriveClient();
    const about = await drive.about.get({ fields: 'user' });
    return {
      connected: true,
      user: about.data.user,
      managedBy: MANAGED_BY,
    };
  } catch (error) {
    return {
      connected: false,
      error: 'Google Drive غير متصل',
      managedBy: MANAGED_BY,
    };
  }
}
