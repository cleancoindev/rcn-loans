import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '../../node_modules/@angular/router';
import { environment } from '../environments/environment';
// App services
import { EventsService } from './services/events.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'app';
  environmentName: any = environment.envName;

  constructor(
    private router: Router,
    private eventsService: EventsService
  ) {}

  ngOnInit(): void {
    (window as any).ga('create', environment.gaTracking, 'auto');
    this.router.events.subscribe(event => {
      try {
        if (event instanceof NavigationEnd) {
          (window as any).ga('set', 'page', event.urlAfterRedirects);
          (window as any).ga('send', 'pageview');
        }
      } catch (e) {
        this.eventsService.trackError(e);
      }
    });
  }
}
