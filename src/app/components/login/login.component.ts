import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  loginForm = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required])
  });

  constructor(
    private authService: AuthService,
    private router: Router
  ) {
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/']);
    }
  }

  
  onSubmit() {
    if (this.loginForm.valid) {
      const { email, password } = this.loginForm.value;
  
      if (email && password) {
        this.authService.login({ email, password }).subscribe({
          next: (response) => {
            console.log('Respuesta del servidor:', response);

            if (response && response.token) {
              localStorage.setItem('token', response.token);
             localStorage.setItem('userId', response.userId.toString());
              this.router.navigate(['/']);
            } else {
              console.error('No se recibió token en la respuesta');
              alert('Error en el inicio de sesión');
            }
          },
          error: (error) => {
            console.error('Error en el login:', error);
            if (error.status === 401) {
              alert('Credenciales inválidas');
            } else {
              alert('Error en el servidor. Por favor, intente más tarde.');
            }
          },
        });
      }
    }
  }
  
}
