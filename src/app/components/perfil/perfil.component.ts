import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth/auth.service';
import { catchError, map, Observable, of } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { UsuariosService } from '../../services/usuarioService/usuarios.service';
import Swal from 'sweetalert2';

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
  usuario: any = null;
  showPassword: boolean = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private userService: UsuariosService,
    private http: HttpClient
  ) {
    this.perfilForm = this.fb.group({
      name: ['', [
        Validators.required,
        Validators.minLength(3),
        Validators.pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
      ]],
      email: ['', [
        Validators.required,
        Validators.email,
        this.validDomain,
      ], [this.emailValidator()]], // Se mantiene el validador del email],
      password: ['', [
        Validators.minLength(8),
        Validators.pattern(/[A-Z]/),
        Validators.pattern(/[0-9]/),
        Validators.pattern(/[!@#$%^&*(),.?":{}|<>]/)
      ]],
      telefono: ['', [
        Validators.required,
        Validators.pattern('^[0-9]{10}$')
      ], [this.telefonoValidator()]], // Se mantiene el validador del teléfono
      direccion: ['', [
        Validators.required,
        Validators.minLength(5)
      ]]
    });
  }

  ngOnInit() {
    this.cargarDatosUsuario();
    this.perfilForm.disable(); // Desactiva el formulario inicialmente
  }

  cargarDatosUsuario() {
    this.cargando = true;
    this.error = null;
    const userLocal = localStorage.getItem('userId');

    if (userLocal) {
      try {
        this.profileData = JSON.parse(userLocal);
        this.userService.getUserById(userLocal).subscribe({
          next: (response) => {
            this.usuario = response;
            this.perfilForm.patchValue({
              name: this.usuario.name,
              email: this.usuario.email,
              telefono: this.usuario.telefono,
              direccion: this.usuario.direccion,
              password: '' // Dejar el campo de contraseña vacío
            });
            this
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
        this.cargando = false;
      }
      return;
    }

    const token = this.authService.getToken();
    if (!token) {
      this.error = 'No estás autenticado';
      this.cargando = false;
      return;
    }

    console.log('ESTE ES EL TOKEN: ' + token);
    
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
  
      const token = this.authService.getToken();
      const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
      const updatedData = this.perfilForm.value;
      const id = localStorage.getItem('userId');
  
      console.log('Datos actualizados que se enviarán:', updatedData);
  
      if (!updatedData.password) {
        delete updatedData.password;
      }
  
      this.userService.putUsuario(id, updatedData).subscribe({
        next: (response) => {
          console.log('Perfil actualizado:', response);
          this.profileData = response; 
          this.modoEdicion = false;
          this.perfilForm.disable();
          this.cargando = false;
  
          Swal.fire({
            title: '¡Éxito!',
            text: 'Perfil actualizado correctamente.',
            icon: 'success',
            confirmButtonText: 'Aceptar'
          });
        },
        error: (err) => {
          this.modoEdicion = false;
          this.perfilForm.disable();
          this.cargando = false;
          console.log('Error al actualizar el perfil:', err);
          Swal.fire({
            title: '¡Éxito!',
            text: 'Perfil actualizado correctamente.',
            icon: 'success',
            confirmButtonText: 'Aceptar'
          });
        }
      });
    } else {
      Swal.fire({
        title: 'Campos incompletos',
        text: 'Por favor, completa todos los campos correctamente.',
        icon: 'warning',
        confirmButtonText: 'Aceptar'
      });
    }
  }
  
  telefonoValidator() {
    
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      if (!control.value || !control.value.match(/^[0-9]{10}$/)) {
        return of(null);
      }
  
      return this.userService.checkTelefono(control.value).pipe(
        map(response => {
          if (response.exists && control.value !== this.usuario.telefono) {
            return { telefonoTaken: true };
          }
          return null;
        }),
        catchError(() => of(null)) 
      );
    };
  }

  emailValidator() {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      if (!control.value || !control.value.includes('@')) {
        return of(null);
      }

      return this.userService.checkEmail(control.value).pipe(
        map(response => {
          if (response.exists && control.value !== this.usuario.email) {
            return { emailTaken: true };
          }
          return null;
        }),
        catchError(() => of(null))
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
        case 'telefono':
          if (control.errors['pattern']) return 'El teléfono debe tener 10 dígitos numéricos';
          if (control.errors['telefonoTaken']) return 'Este teléfono ya está registrado';
          
          break;
      }
    }
    return '';
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }
}
