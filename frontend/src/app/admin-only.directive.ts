import { Directive, TemplateRef, ViewContainerRef, inject, Input, DoCheck } from '@angular/core';
import { AuthService } from './auth.service';

@Directive({
  selector: '[appIfAdmin]',
  standalone: true
})
export class AdminOnlyDirective implements DoCheck {
  private auth = inject(AuthService);
  private hasView = false;

  constructor(private tpl: TemplateRef<any>, private vcr: ViewContainerRef) {}

  // Angular will call this when the directive input is set. Use same name as selector.
  @Input()
  set appIfAdmin(condition: any) {
    const isAdmin = this.auth.hasRole('admin');
    if (isAdmin && !this.hasView) {
      this.vcr.createEmbeddedView(this.tpl);
      this.hasView = true;
    } else if (!isAdmin && this.hasView) {
      this.vcr.clear();
      this.hasView = false;
    }
  }

  ngDoCheck() {
    const isAdmin = this.auth.hasRole('admin');
    if (isAdmin && !this.hasView) {
      this.vcr.createEmbeddedView(this.tpl);
      this.hasView = true;
    } else if (!isAdmin && this.hasView) {
      this.vcr.clear();
      this.hasView = false;
    }
  }
}
