import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {
  
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(): boolean {
    console.log('AdminGuard - Verificando rol:', this.authService.getRole());
    if (this.authService.isAdmin()) {
      return true;
    }
    
    console.log('Acceso denegado - No es admin');
    this.router.navigate(['/acceso-denegado']);
    return false;
  }
} 