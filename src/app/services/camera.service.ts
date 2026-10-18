import { Injectable } from '@angular/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { FirebaseService } from './firebase.service';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';

@Injectable({
  providedIn: 'root'
})
export class CameraService {
  constructor(private firebaseService: FirebaseService) {}

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

      const storageRef = ref(this.firebaseService.storage, `users/${userId}/profile.jpg`);
      await uploadString(storageRef, image.dataUrl, 'data_url');
      const downloadUrl = await getDownloadURL(storageRef);
      return downloadUrl;
    } catch (error) {
      console.error('Error taking/uploading photo:', error);
      throw error;
    }
  }
}
