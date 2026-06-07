import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  signOut as firebaseSignOut, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  User 
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Define the state structure for components to subscribe to
export interface GoogleDriveState {
  isLoggedIn: boolean;
  userProfile: {
    displayName: string | null;
    email: string | null;
    photoURL: string | null;
    uid: string;
  } | null;
  driveConnectionStatus: 'disconnected' | 'connecting' | 'connected' | 'syncing' | 'error';
  error: string | null;
  lastSynced: string | null;
}

type Listener = (state: GoogleDriveState) => void;

class GoogleDriveService {
  private auth;
  private provider: GoogleAuthProvider;
  private cachedAccessToken: string | null = null;
  private listeners: Set<Listener> = new Set();
  private isSigningIn = false;

  private state: GoogleDriveState = {
    isLoggedIn: false,
    userProfile: null,
    driveConnectionStatus: 'disconnected',
    error: null,
    lastSynced: null,
  };

  constructor() {
    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    this.auth = getAuth(app);

    // Initialize Google Auth Provider with Narrowest scopes
    this.provider = new GoogleAuthProvider();
    this.provider.addScope('https://www.googleapis.com/auth/drive.file');
  }

  // Get current state
  public getState(): GoogleDriveState {
    return { ...this.state };
  }

  // Subscribe to state updates
  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    // Call listener immediately with current state
    listener(this.state);

    return () => {
      this.listeners.delete(listener);
    };
  }

  // Emit state changes to all subscribers
  private emit() {
    const currentState = this.getState();
    this.listeners.forEach((listener) => {
      try {
        listener(currentState);
      } catch (err) {
        console.error('Error in subscriber listener:', err);
      }
    });
  }

  // Update a slice of state
  private updateState(updates: Partial<GoogleDriveState>) {
    this.state = {
      ...this.state,
      ...updates,
    };
    this.emit();
  }

  // Initialize Auth State Listener
  public init() {
    onAuthStateChanged(this.auth, async (user: User | null) => {
      if (user) {
        // If logged in, get credential or prompt login if token missing.
        // Retrieve access token if cached.
        if (this.cachedAccessToken) {
          this.updateState({
            isLoggedIn: true,
            userProfile: {
              displayName: user.displayName,
              email: user.email,
              photoURL: user.photoURL,
              uid: user.uid,
            },
            driveConnectionStatus: 'connected',
            error: null,
          });
        } else if (!this.isSigningIn) {
          // Trigger implicit disconnect if state lost on page hard reload
          this.updateState({
            isLoggedIn: false,
            userProfile: null,
            driveConnectionStatus: 'disconnected',
            error: null,
          });
        }
      } else {
        this.cachedAccessToken = null;
        this.updateState({
          isLoggedIn: false,
          userProfile: null,
          driveConnectionStatus: 'disconnected',
          error: null,
        });
      }
    });
  }

  // Trigger login via popup
  public async signIn(): Promise<{ user: User; accessToken: string } | null> {
    try {
      this.isSigningIn = true;
      this.updateState({ driveConnectionStatus: 'connecting', error: null });

      const result = await signInWithPopup(this.auth, this.provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      
      if (!credential?.accessToken) {
        throw new Error('Access token was not provided by Google Authentication. Make sure permissions are granted.');
      }

      this.cachedAccessToken = credential.accessToken;
      
      this.updateState({
        isLoggedIn: true,
        userProfile: {
          displayName: result.user.displayName,
          email: result.user.email,
          photoURL: result.user.photoURL,
          uid: result.user.uid,
        },
        driveConnectionStatus: 'connected',
        error: null,
      });

      return { user: result.user, accessToken: this.cachedAccessToken };
    } catch (error: any) {
      console.error('Core Google API Sign in error:', error);
      let clientMsg = 'Google authentication cancelled or failed to load. Please try again.';
      if (error?.code === 'auth/popup-blocked') {
        clientMsg = 'Sign in popup was blocked by your browser. Please allow popups for active backup.';
      } else if (error?.code === 'auth/network-request-failed') {
        clientMsg = 'Network connection issue detected. Please check your connectivity.';
      } else if (error?.message) {
        clientMsg = error.message;
      }
      
      this.updateState({
        driveConnectionStatus: 'error',
        error: clientMsg,
      });
      throw new Error(clientMsg);
    } finally {
      this.isSigningIn = false;
    }
  }

  // Sign out user
  public async signOut(): Promise<void> {
    try {
      await firebaseSignOut(this.auth);
      this.cachedAccessToken = null;
      this.updateState({
        isLoggedIn: false,
        userProfile: null,
        driveConnectionStatus: 'disconnected',
        error: null,
      });
    } catch (error: any) {
      console.error('Sign out error:', error);
      this.updateState({ error: 'Failed to sign out clean from Google session.' });
    }
  }

  // Public getter to fetch current access token safely
  public async getAccessToken(): Promise<string | null> {
    return this.cachedAccessToken;
  }

  /**
   * Searched Google Drive for a file named 'habit-tracker-backup.json'
   * Returns file id if found, otherwise null
   */
  private async findBackupFile(token: string): Promise<string | null> {
    try {
      const q = encodeURIComponent("name = 'habit-tracker-backup.json' and trashed = false");
      const url = `https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name)`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Cloud Drive search error with status: ${response.status}`);
      }

      const body = await response.json();
      if (body.files && body.files.length > 0) {
        return body.files[0].id;
      }
      return null;
    } catch (e: any) {
      console.error('Failed to locate cloud files:', e);
      throw e;
    }
  }

  /**
   * Save app data safely into Google Drive
   */
  public async saveToDrive(data: any): Promise<boolean> {
    const token = this.cachedAccessToken;
    if (!token) {
      this.updateState({ error: 'Authentication missing. Please sign in to enable backup.' });
      return false;
    }

    try {
      this.updateState({ driveConnectionStatus: 'syncing', error: null });

      const existingFileId = await this.findBackupFile(token);

      if (existingFileId) {
        // Mode: UPDATE File content
        const updateUrl = `https://www.googleapis.com/upload/drive/v3/files/${existingFileId}?uploadType=media`;
        const updateResponse = await fetch(updateUrl, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        });

        if (!updateResponse.ok) {
          if (updateResponse.status === 401) {
            throw new Error('Google authorization token has expired. Please sign in again.');
          }
          throw new Error(`Failed to update backup file on Google Drive (HTTP ${updateResponse.status})`);
        }
      } else {
        // Mode: CREATE New File with multipart upload
        const boundary = 'gdir_habit_tracker_bound';
        const delimiter = `\r\n--${boundary}\r\n`;
        const close_delimiter = `\r\n--${boundary}--`;

        const metadata = {
          name: 'habit-tracker-backup.json',
          mimeType: 'application/json',
          description: 'Stored daily routines and consistency statistics from Habit Tracker',
        };

        const body = 
          delimiter +
          'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
          JSON.stringify(metadata) +
          delimiter +
          'Content-Type: application/json\r\n\r\n' +
          JSON.stringify(data) +
          close_delimiter;

        const createUrl = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';
        const createResponse = await fetch(createUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': `multipart/related; boundary=${boundary}`,
          },
          body: body,
        });

        if (!createResponse.ok) {
          if (createResponse.status === 401) {
            throw new Error('Google authorization token has expired. Please sign in again.');
          }
          throw new Error(`Failed to create backup file on Google Drive (HTTP ${createResponse.status})`);
        }
      }

      this.updateState({
        driveConnectionStatus: 'connected',
        error: null,
        lastSynced: new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      });

      return true;
    } catch (err: any) {
      console.error('Error in saveToDrive API:', err);
      const userFriendlyMsg = err.message || 'Failed to upload user data to Drive. Check your connection or token validity.';
      this.updateState({
        driveConnectionStatus: 'error',
        error: userFriendlyMsg,
      });
      return false;
    }
  }

  /**
   * Load app data back from Google Drive
   */
  public async loadFromDrive(): Promise<any | null> {
    const token = this.cachedAccessToken;
    if (!token) {
      this.updateState({ error: 'Auth session expired. Sign in to recover backup files.' });
      return null;
    }

    try {
      this.updateState({ driveConnectionStatus: 'syncing', error: null });

      const fileId = await this.findBackupFile(token);
      if (!fileId) {
        this.updateState({ 
          driveConnectionStatus: 'connected',
          error: 'No backup file found under Google Drive. Try saving first!',
        });
        return null;
      }

      const downloadUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
      const response = await fetch(downloadUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authorization credentials expired. Please sign in and retry.');
        }
        throw new Error('Failed to retrieve your routine goals content from Google Drive.');
      }

      const content = await response.json();
      
      this.updateState({
        driveConnectionStatus: 'connected',
        error: null,
        lastSynced: new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      });

      return content;
    } catch (err: any) {
      console.error('Error loadFromDrive API:', err);
      const msg = err.message || 'Could not fetch your sync copy from Drive. Please try again.';
      this.updateState({
        driveConnectionStatus: 'error',
        error: msg,
      });
      return null;
    }
  }
}

export const googleDriveService = new GoogleDriveService();
