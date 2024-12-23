import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth/auth.service';
import { catchError, map, Observable, of } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { UsuariosService } from '../../services/usuarioService/usuarios.service';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './perfil.component.html',
  styleUrls: ['./perfil.component.css']
})
export class PerfilComponent implements OnInit {
  perfilForm: FormGroup;
  modoEdicion: boolean = false;
  cargando: boolean = true;
  error: string | null = null;
  profileData: any = null;
  errorMessage: string = ''; 
  usuario: any = null;
  showPassword: boolean = false;


  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private userService: UsuariosService,
    private http: HttpClient
  ) {
    this.perfilForm = new FormGroup({
      name: new FormControl('', [
        Validators.required,
        Validators.minLength(3),
        Validators.pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
      ]),
      email: new FormControl('', [
        Validators.required,
        Validators.email,
        this.validDomain
      ]),
      password: new FormControl('', [
        Validators.required,
        Validators.minLength(8),
        Validators.pattern(/[A-Z]/),
        Validators.pattern(/[0-9]/),
        Validators.pattern(/[!@#$%^&*(),.?":{}|<>]/)
      ]),
      telefono: new FormControl('', [
        Validators.required,
        Validators.pattern('^[0-9]{10}$')
      ], [
        this.telefonoValidator()
      ]),
      direccion: new FormControl('', [
        Validators.required,
        Validators.minLength(5)
      ])
    });
  }

  ngOnInit() {
    this.cargarDatosUsuario();
  }

  
  cargarDatosUsuario() {
    this.cargando = true;
    this.error = null;
    const userNuevo = localStorage.getItem('user');

    if (userNuevo) {
      try {
        this.profileData = JSON.parse(userNuevo);
        this.userService.getUserById(this.profileData.id).subscribe({
          next: (response) => {
            this.usuario = response;
            this.perfilForm.patchValue(this.usuario);

            this.cargando = false;
          },
          error: (error) => {
            console.error('Error al obtener el usuario por ID:', error);
            this.error = 'Error al obtener los datos del usuario';
            this.cargando = false;
          }
        });
      } catch (e) {
        console.error('Error al parsear los datos del usuario:', e);
        this.error = 'Error al cargar los datos del usuario';
      }
      this.cargando = false;
      return;
    }
 const token = this.authService.getToken();
 if (!token) {
   this.error = 'No estás autenticado';
   this.cargando = false;
   return;
 }

 const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
 this.http.get('http://localhost:3000/usuarios/profile', { headers }).subscribe({
   next: (response: any) => {
     this.profileData = response.user;
     this.perfilForm.patchValue(this.profileData);
     this.cargando = false;
   },
   error: (error) => {
     console.error('Error al obtener perfil:', error);
     this.error = 'Error al obtener perfil';
     this.cargando = false;
   }
 });
}

  validDomain(control: AbstractControl): ValidationErrors | null {
    const email = control.value;
    if (email && email.includes('@')) {
      const domain = email.split('@')[1];
      if (!['gmail.com', 'hotmail.com'].includes(domain)) {
        return { invalidDomain: true };
      }
    }
    return null;
  }

  toggleEdicion() {
    this.modoEdicion = !this.modoEdicion;
    if (this.modoEdicion) {
      this.perfilForm.enable();
    } else {
      this.perfilForm.disable();
      this.cargarDatosUsuario(); 
    }
  }

  guardarCambios() {
    if (this.perfilForm.valid) {
      this.cargando = true;
      this.error = null;

      const token = localStorage.getItem('auth_token'); 
      const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`); 

      this.authService.actualizarPerfil(this.perfilForm.value).subscribe({
        next: (response) => {
          console.log('Perfil actualizado:', response);
          this.modoEdicion = false;
          this.perfilForm.disable();
          this.cargando = false;
          alert('Perfil actualizado correctamente');
        },
        error: (err) => {
          console.error('Error al actualizar:', err);
          this.error = 'Error al actualizar el perfil';
          this.cargando = false;
        }
      });
    }
  }

  telefonoValidator() {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      if (!control.value || !control.value.match(/^[0-9]{10}$/)) {
        return of(null);
      }

      console.log('Verificando teléfono:', control.value);

      return this.userService.checkTelefono(control.value).pipe(
        map(response => {
          console.log('Respuesta del servidor:', response);
          return response.exists ? { telefonoTaken: true } : null;
        }),
        catchError(error => {
          console.error('Error en validación de teléfono:', error);
          return of(null);
        })
      );
    };
  }

  getErrorMessage(controlName: string): string {
    const control = this.perfilForm.get(controlName);
    if (control?.errors && control.touched) {
      if (control.errors['required']) return 'Este campo es requerido';
      
      switch (controlName) {
        case 'name':
          if (control.errors['minlength']) return 'El nombre debe tener al menos 3 caracteres';
          if (control.errors['pattern']) return 'Solo se permiten letras y espacios';
          break;
        
        case 'email':
          if (control.errors['email']) return 'Email inválido';
          if (control.errors['invalidDomain']) return 'Solo se permiten correos de Gmail o Hotmail';
          if (control.errors['emailTaken']) return 'Este email ya está registrado';
          break;
        
        case 'password':
          if (control.errors['minlength']) return 'La contraseña debe tener al menos 8 caracteres';
          if (control.errors['pattern']) 
            return 'La contraseña debe contener al menos una mayúscula, un número y un carácter especial';
          break;
        
        case 'telefono':
          if (control.errors['pattern']) return 'El teléfono debe tener 10 dígitos numéricos';
          if (control.errors['telefonoTaken']) return 'Este teléfono ya está registrado';
          break;
        
        case 'direccion':
          if (control.errors['minlength']) return 'La dirección debe tener al menos 5 caracteres';
          break;
      }
    }
    return '';
  }
  
  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }
}


