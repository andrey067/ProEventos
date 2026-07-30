import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavComponent } from './shared/nav/nav.component';
import { routeFadeAnimation } from './shared/motion';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NavComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  animations: [routeFadeAnimation],
})
export class App {}
