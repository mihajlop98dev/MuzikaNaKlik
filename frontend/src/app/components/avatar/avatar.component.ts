import { Component, Input } from '@angular/core';
import { NgIf } from '@angular/common';

/**
 * Performer image, or their initials when there is none.
 *
 * The fallback used to be a random photo from picsum.photos, which was wrong
 * twice over: it sent every visitor's IP to a third party, and it dressed a
 * performer with no photo in a stranger's face — on a booking site a client
 * reasonably reads that image as the person they are about to hire.
 *
 * Initials are unmistakably a placeholder, cost no request, and give the
 * performer a visible reason to upload something of their own.
 */
@Component({
  selector: 'app-avatar',
  standalone: true,
  imports: [NgIf],
  template: `
    <img *ngIf="src" [src]="src" [alt]="name" [class]="imgClass" />
    <span *ngIf="!src" class="avatar-initials" [class]="imgClass" [attr.aria-label]="name">
      {{ initials }}
    </span>
  `,
})
export class AvatarComponent {
  @Input() src: string | null | undefined = null;
  @Input() name = '';
  /** Class of the element being replaced, so existing layout rules still apply. */
  @Input() imgClass = '';

  get initials(): string {
    const words = (this.name || '')
      .trim()
      .split(/\s+/)
      .filter((w) => /\p{L}/u.test(w));

    if (words.length === 0) return '?';

    // Two letters from two words, otherwise the first two of a single word —
    // "DJ Relja" reads better as DR than as D.
    if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
    return (words[0][0] + words[1][0]).toUpperCase();
  }
}
