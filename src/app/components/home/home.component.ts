import { CommonModule } from '@angular/common';
import { Component, HostListener, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';


@Component({
    selector: 'app-home',
    imports: [CommonModule, RouterModule],
    templateUrl: './home.component.html',
    styleUrl: './home.component.css'
})
export class HomeComponent{
  
  constructor() {
    setTimeout(() => {
      this.showHeroSection = true;
    }, 500); 
  }

scrollToSection(sectionId: string): void {
    const section = document.getElementById(sectionId);
    
    if (section) {
      section.scrollIntoView({
        behavior: 'smooth', 
        block: 'start'      
      });
    }
  }

  
  showHeroSection = false;
  botonRegresarVisible = false;

  @HostListener('window:scroll', [])
  onWindowScroll(): void {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const heroSectionHeight = document.getElementById('inicio')?.offsetHeight || 0;
    
    this.botonRegresarVisible = scrollTop > heroSectionHeight;
  }

  scrollToInicio(): void {
    const inicioSection = document.getElementById('inicio');
    if (inicioSection) {
      inicioSection.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
  }
}

