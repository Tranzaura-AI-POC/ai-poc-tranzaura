import { Directive, TemplateRef, ViewContainerRef, inject, Input, OnInit, OnDestroy } from '@angular/core';
import { AuthService } from './auth.service';
import { Subscription } from 'rxjs';

@Directive({
  selector: '[appIfAdmin]',
  standalone: true
})
export class AdminOnlyDirective implements OnInit, OnDestroy {
  private auth = inject(AuthService);
  private hasView = false;
  private sub: Subscription | null = null;

  constructor(private tpl: TemplateRef<any>, private vcr: ViewContainerRef) {}

  // Accept an optional role name (not required). If not provided, default to 'admin'.
  @Input()
  appIfAdmin: string | undefined;

  ngOnInit(): void {
    // immediate check
    this.updateView();
    // subscribe to auth changes so view updates immediately
    this.sub = this.auth.authState.subscribe(() => this.updateView());
  }

  ngOnDestroy(): void {
    if (this.sub) this.sub.unsubscribe();
  }

  private updateView() {
    const role = this.appIfAdmin || 'admin';
    const isAdmin = this.auth.hasRole(role);
    if (isAdmin && !this.hasView) {
      this.vcr.createEmbeddedView(this.tpl);
      this.hasView = true;
    } else if (!isAdmin && this.hasView) {
      this.vcr.clear();
      this.hasView = false;
    }
  }
}
