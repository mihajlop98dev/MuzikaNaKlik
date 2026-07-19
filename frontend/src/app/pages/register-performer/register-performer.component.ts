import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-register-performer',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './register-performer.component.html',
})
export class RegisterPerformerComponent implements OnInit {
  step = 1;
  error = '';
  loading = false;

  // Step 1 - Basic info
  stageName = '';
  performerType = 'band';
  city = '';
  phone = '';
  email = '';
  password = '';

  // Step 2 - About
  availableGenres: any[] = [];
  selectedGenres: string[] = [];
  customGenres = '';
  description = '';
  priceFrom = 0;
  memberCount = 3;
  travelRadius = '';

  // Step 2 - Language
  availableLanguages: any[] = [];
  selectedLanguages: string[] = [];
  customLanguages = '';

  // Step 2 - Equipment
  availableEquipment: any[] = [];
  selectedEquipment: string[] = [];
  customEquipment = '';

  // Step 3 - Profile image
  profileImageUrl = '';

  // Step 5 - Subscription
  subscriptionPlans: any[] = [];
  selectedPlanId = '';
  billingPeriod: 'monthly' | 'yearly' = 'monthly';
  submitting = false;

  // Step 4 - Video
  videoUrls: string[] = [''];
  videoErrors: string[] = [''];
  audioUrl = '';

  constructor(
    private api: ApiService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.api.get<any[]>('/genres').subscribe(data => {
      this.availableGenres = data;
      this.cdr.detectChanges();
    });
    this.api.get<any[]>('/languages').subscribe(data => {
      this.availableLanguages = data;
      this.cdr.detectChanges();
    });
    this.api.get<any[]>('/equipment').subscribe(data => {
      this.availableEquipment = data;
      this.cdr.detectChanges();
    });
    this.api.get<any[]>('/subscription-plans').subscribe(data => {
      this.subscriptionPlans = data;
      this.cdr.detectChanges();
    });
  }

  toggleGenre(name: string) {
    const idx = this.selectedGenres.indexOf(name);
    if (idx >= 0) this.selectedGenres.splice(idx, 1);
    else this.selectedGenres.push(name);
  }

  toggleLanguage(name: string) {
    const idx = this.selectedLanguages.indexOf(name);
    if (idx >= 0) this.selectedLanguages.splice(idx, 1);
    else this.selectedLanguages.push(name);
  }

  toggleEquipment(name: string) {
    const idx = this.selectedEquipment.indexOf(name);
    if (idx >= 0) this.selectedEquipment.splice(idx, 1);
    else this.selectedEquipment.push(name);
  }

  selectPlan(id: string) {
    this.selectedPlanId = id;
  }

  getPlanPrice(price: number): number {
    return this.billingPeriod === 'yearly' ? price * 10 : price;
  }

  getPlanPeriod(): string {
    return this.billingPeriod === 'yearly' ? 'godišnje' : 'mesečno';
  }

  addVideoField() {
    this.videoUrls.push('');
    this.videoErrors.push('');
  }

  removeVideoField(index: number) {
    this.videoUrls.splice(index, 1);
    this.videoErrors.splice(index, 1);
  }

  validateYouTubeUrl(url: string): boolean {
    if (!url) return true;
    return /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/.test(url);
  }

  extractYoutubeId(url: string): string | null {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
    return match ? match[1] : null;
  }

  validateStep(): boolean {
    this.error = '';
    switch (this.step) {
      case 1:
        if (!this.stageName) { this.error = 'Umetničko ime je obavezno.'; return false; }
        if (!this.email || !this.password) { this.error = 'Email i lozinka su obavezni.'; return false; }
        if (this.password.length < 6) { this.error = 'Lozinka mora imati najmanje 6 karaktera.'; return false; }
        return true;
      case 2:
        if (this.selectedGenres.length === 0) { this.error = 'Izaberite bar jedan žanr.'; return false; }
        return true;
      case 4:
        for (let i = 0; i < this.videoUrls.length; i++) {
          if (this.videoUrls[i] && !this.validateYouTubeUrl(this.videoUrls[i])) {
            this.videoErrors[i] = 'Unesite validan YouTube link.';
            return false;
          }
          this.videoErrors[i] = '';
        }
        return true;
      case 5:
        if (!this.selectedPlanId) { this.error = 'Izaberite paket.'; return false; }
        return true;
      default:
        return true;
    }
  }

  nextStep() {
    if (this.validateStep()) {
      this.step++;
    }
  }

  prevStep() {
    if (this.step > 1) this.step--;
  }

  async uploadImage(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    const file = input.files[0];
    const formData = new FormData();
    formData.append('file', file);
    formData.append('bucket', 'profiles');

    this.api.post<{ url: string }>('/storage/upload', formData).subscribe({
      next: (res) => {
        this.profileImageUrl = res.url;
        this.cdr.detectChanges();
      },
      error: () => {
        this.error = 'Greška pri uploadu slike. Pokušajte ponovo.';
        this.cdr.detectChanges();
      },
    });
  }

  async submit() {
    if (!this.validateStep()) return;
    this.submitting = true;
    this.error = '';

    const validVideos = this.videoUrls
      .map(u => this.extractYoutubeId(u))
      .filter((id): id is string => id !== null);

    const allGenres = [...this.selectedGenres, ...this.customGenres.split(',').map(g => g.trim()).filter(Boolean)];
    const allLanguages = [...this.selectedLanguages, ...this.customLanguages.split(',').map(l => l.trim()).filter(Boolean)];
    const allEquipment = [...this.selectedEquipment, ...this.customEquipment.split(',').map(e => e.trim()).filter(Boolean)];

    const payload = {
      email: this.email,
      password: this.password,
      stage_name: this.stageName,
      type: this.performerType,
      city: this.city,
      phone: this.phone,
      genres: allGenres,
      description: this.description,
      price_from: this.priceFrom || null,
      member_count: this.memberCount,
      travel_radius: this.travelRadius || null,
      equipment: allEquipment,
      languages: allLanguages,
      audio_url: this.audioUrl || null,
      profile_image_url: this.profileImageUrl || null,
      videos: validVideos,
      plan_id: this.selectedPlanId,
      billing_period: this.billingPeriod,
    };

    this.api.post('/auth/register/performer', payload).subscribe({
      next: () => {
        this.step = 6;
        this.submitting = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.error = err.error?.error || 'Došlo je do greške. Pokušajte ponovo.';
        this.submitting = false;
        this.cdr.detectChanges();
      },
    });
  }
}
