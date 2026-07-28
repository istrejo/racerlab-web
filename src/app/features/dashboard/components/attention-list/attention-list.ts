import { Component, input } from '@angular/core';

export type DashboardAttentionListItem = {
  id: string;
  primary: string;
  secondary: string;
  value: string;
  detail: string;
};

@Component({
  selector: 'app-dashboard-attention-list',
  host: { class: 'block' },
  templateUrl: './attention-list.html',
})
export class AttentionListComponent {
  readonly title = input.required<string>();
  readonly description = input.required<string>();
  readonly badge = input.required<string>();
  readonly tone = input.required<'warning' | 'danger'>();
  readonly items = input.required<readonly DashboardAttentionListItem[]>();
}
