import { Injectable, inject } from '@angular/core';
import { Auth as FirebaseAuth, User, createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged, RecaptchaVerifier, signInWithPhoneNumber, signInAnonymously, UserCredential } from '@angular/fire/auth';
import { Firestore, doc, setDoc, getDoc, serverTimestamp } from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { Observable, BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private auth: FirebaseAuth = inject(FirebaseAuth);
  private firestore: Firestore = inject(Firestore);
  private router: Router = inject(Router);
  private userSubject = new BehaviorSubject<User | null>(null);
  private authInitialized = false;
  public user$: Observable<User | null> = this.userSubject.asObservable();

  constructor() {
    // Initialize auth state listener
    onAuthStateChanged(this.auth, (user) => {
      this.userSubject.next(user);
      this.authInitialized = true;
    });
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.auth.currentUser !== null;
  }

  /**
   * Wait for auth state to be initialized
   */
  waitForAuth(): Promise<User | null> {
    return new Promise((resolve) => {
      if (this.authInitialized) {
        resolve(this.auth.currentUser);
      } else {
        const subscription = this.user$.subscribe(user => {
          if (this.authInitialized) {
            subscription.unsubscribe();
            resolve(user);
          }
        });
      }
    });
  }

  async registerWithEmail(email: string, password: string, name: string, phone?: string): Promise<UserCredential> {
    try {
      const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
      await this.saveUserData(userCredential.user.uid, {
        name,
        email,
        phone: phone || '',
        createdAt: serverTimestamp()
      });
      return userCredential;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  async loginWithEmail(email: string, password: string): Promise<UserCredential> {
    try {
      return await signInWithEmailAndPassword(this.auth, email, password);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  async loginWithGoogle(): Promise<UserCredential> {
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(this.auth, provider);
      await this.saveUserData(userCredential.user.uid, {
        name: userCredential.user.displayName || '',
        email: userCredential.user.email || '',
        phone: userCredential.user.phoneNumber || '',
        createdAt: serverTimestamp()
      });
      return userCredential;
    } catch (error) {
      console.error('Google login error:', error);
      throw error;
    }
  }

  async loginWithPhone(phoneNumber: string, recaptchaVerifier: RecaptchaVerifier): Promise<any> {
    try {
      return await signInWithPhoneNumber(this.auth, phoneNumber, recaptchaVerifier);
    } catch (error) {
      console.error('Phone login error:', error);
      throw error;
    }
  }

  async loginAnonymously(): Promise<UserCredential> {
    try {
      const userCredential = await signInAnonymously(this.auth);
      // Save anonymous user data with default name
      await this.saveUserData(userCredential.user.uid, {
        name: 'Anonymous User',
        email: '',
        phone: '',
        isAnonymous: true,
        createdAt: serverTimestamp()
      });
      return userCredential;
    } catch (error) {
      console.error('Anonymous login error:', error);
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      await signOut(this.auth);
      this.router.navigate(['/login']);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }

  getCurrentUser(): User | null {
    return this.auth.currentUser;
  }

  private async saveUserData(userId: string, userData: any): Promise<void> {
    try {
      const userRef = doc(this.firestore, `users/${userId}`);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        // Create new user document
        await setDoc(userRef, userData, { merge: true });
      } else {
        // Update existing user document, preserve createdAt
        const existingData = userDoc.data();
        await setDoc(userRef, { 
          ...userData, 
          createdAt: existingData['createdAt'] || userData['createdAt'] 
        }, { merge: true });
      }
    } catch (error) {
      console.error('Error saving user data:', error);
      // Don't throw error - allow user to continue even if saving profile fails
      // The user data will be saved on next login or profile update
    }
  }

  async getUserData(userId: string): Promise<any> {
    try {
      const userRef = doc(this.firestore, `users/${userId}`);
      const userDoc = await getDoc(userRef);
      if (userDoc.exists()) {
        return userDoc.data();
      } else {
        // Return default user data if document doesn't exist
        const currentUser = this.auth.currentUser;
        if (currentUser) {
          // Check if user is anonymous
          if (currentUser.isAnonymous) {
            return {
              name: 'Anonymous User',
              email: '',
              phone: '',
              isAnonymous: true,
              createdAt: null
            };
          }
          return {
            name: currentUser.displayName || currentUser.email?.split('@')[0] || 'User',
            email: currentUser.email || '',
            phone: currentUser.phoneNumber || '',
            createdAt: null
          };
        }
        return null;
      }
    } catch (error) {
      console.error('Error getting user data:', error);
      // Return default data on error
      const currentUser = this.auth.currentUser;
      if (currentUser) {
        // Check if user is anonymous
        if (currentUser.isAnonymous) {
          return {
            name: 'Anonymous User',
            email: '',
            phone: '',
            isAnonymous: true,
            createdAt: null
          };
        }
        return {
          name: currentUser.displayName || currentUser.email?.split('@')[0] || 'User',
          email: currentUser.email || '',
          phone: currentUser.phoneNumber || '',
          createdAt: null
        };
      }
      return null;
    }
  }
}
