import { Component } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-performer-repertoire',
  standalone: true,
  imports: [NgFor, NgIf, FormsModule],
  templateUrl: './performer-repertoire.component.html',
})
export class PerformerRepertoireComponent {
  songs: string[] = [];
  newSong = '';

  addSong() {
    if (this.newSong.trim()) {
      this.songs.push(this.newSong.trim());
      this.newSong = '';
    }
  }

  removeSong(index: number) {
    this.songs.splice(index, 1);
  }
}
