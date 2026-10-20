import { Injectable } from '@angular/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { FirebaseService } from './firebase.service';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';

@Injectable({
  providedIn: 'root'
})
export class CameraService {
  constructor(private firebaseService: FirebaseService) {}

  async uploadDataUrl(userId: string, dataUrl: string): Promise<string> {
    const storageRef = ref(this.firebaseService.storage, `users/${userId}/profile.jpg`);
    await uploadString(storageRef, dataUrl, 'data_url');
    return getDownloadURL(storageRef);
  }

  async takeAndUploadPhoto(userId: string): Promise<string> {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: true,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Prompt
      });

      if (!image.dataUrl) {
        throw new Error('No image data captured');
      }

      return await this.uploadDataUrl(userId, image.dataUrl);
    } catch (error) {
      console.error('Error taking/uploading photo:', error);
      throw error;
    }
  }
}
