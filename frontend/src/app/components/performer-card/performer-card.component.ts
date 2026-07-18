import { Component, Input } from '@angular/core';
import { NgIf } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Performer } from '../../models/performer.model';

@Component({
  selector: 'app-performer-card',
  standalone: true,
  imports: [NgIf, RouterLink],
  templateUrl: './performer-card.component.html',
})
export class PerformerCardComponent {
  @Input({ required: true }) performer!: Performer;
  @Input() featured = false;
}
