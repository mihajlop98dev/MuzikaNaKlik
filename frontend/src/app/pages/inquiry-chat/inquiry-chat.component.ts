import { Component, OnInit, OnDestroy, ChangeDetectorRef, ElementRef, ViewChild } from '@angular/core';
import { NgFor, NgIf, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { RealtimeChannel } from '@supabase/supabase-js';
import { InquiryService } from '../../services/inquiry.service';
import { MessageService } from '../../services/message.service';
import { SupabaseService } from '../../services/supabase.service';
import { Inquiry, Message } from '../../models/performer.model';

@Component({
  selector: 'app-inquiry-chat',
  standalone: true,
  imports: [NgFor, NgIf, DatePipe, FormsModule, RouterLink],
  templateUrl: './inquiry-chat.component.html',
})
export class InquiryChatComponent implements OnInit, OnDestroy {
  inquiry?: Inquiry;
  messages: Message[] = [];
  loading = true;
  notFound = false;
  draft = '';
  myRole: 'client' | 'performer' | null = null;
  myUserId = '';

  @ViewChild('scrollAnchor') scrollAnchor?: ElementRef<HTMLDivElement>;

  private channel?: RealtimeChannel;

  constructor(
    private route: ActivatedRoute,
    private inquiryService: InquiryService,
    private messageService: MessageService,
    private supabase: SupabaseService,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;

    const { data: { session } } = await this.supabase.getSession();
    this.myUserId = session?.user.id || '';

    this.inquiryService.getById(id).subscribe({
      next: (inquiry) => {
        this.inquiry = inquiry;
        this.myRole = inquiry.performer_id === this.myUserId ? 'performer' : 'client';
        this.loading = false;
        this.cdr.detectChanges();
        this.scrollToBottom();

        if (this.myRole === 'performer' && inquiry.status === 'new') {
          this.inquiryService.updateStatus(id, 'read').subscribe();
        }
      },
      error: () => {
        this.notFound = true;
        this.loading = false;
        this.cdr.detectChanges();
      },
    });

    this.messageService.getForInquiry(id).subscribe((data) => {
      this.messages = data;
      this.cdr.detectChanges();
      this.scrollToBottom();
    });

    this.channel = this.messageService.subscribeToInquiry(id, (message) => {
      if (this.messages.some((m) => m.id === message.id)) return;
      this.messages.push(message);
      this.cdr.detectChanges();
      this.scrollToBottom();
    });
  }

  ngOnDestroy() {
    if (this.channel) this.supabase.client.removeChannel(this.channel);
  }

  send() {
    const text = this.draft.trim();
    if (!text || !this.inquiry || !this.myRole) return;
    this.draft = '';
    this.cdr.detectChanges();

    this.messageService.send(this.inquiry, this.myRole, text).subscribe({
      next: (message) => {
        if (!this.messages.some((m) => m.id === message.id)) {
          this.messages.push(message);
        }
        this.cdr.detectChanges();
        this.scrollToBottom();
      },
    });
  }

  onEnter(event: Event) {
    event.preventDefault();
    this.send();
  }

  private scrollToBottom() {
    setTimeout(() => {
      this.scrollAnchor?.nativeElement?.scrollIntoView({ behavior: 'smooth' });
    });
  }
}
