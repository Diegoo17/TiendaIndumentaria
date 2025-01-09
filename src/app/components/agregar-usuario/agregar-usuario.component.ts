import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { UsuariosService } from '../../services/usuarioService/usuarios.service';
import { ProductosService } from '../../services/productoService/productos.service';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Usuario } from '../../interface/usuario';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

@Component({
    selector: 'app-agregar-usuario',
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './agregar-usuario.component.html',
    styleUrl: './agregar-usuario.component.css'
})


export class AgregarUsuarioComponent implements OnInit {
  form: FormGroup;
  productos: any[] = [];
  currentIndex = 0;
  slideDirection = '';
  isAnimating = false;
  nextImageReady = false;
  nextIndex = 0;
  loadingIndicator = false;

  constructor(
    private userService: UsuariosService,
    private productosService: ProductosService,
    private router: Router
  ) {
    this.form = new FormGroup({
      nombre: new FormControl('', [
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

    this.form.get('email')?.valueChanges
      .pipe(
        debounceTime(500),
        distinctUntilChanged(),
        switchMap(email => this.userService.checkEmail(email))
      )
      .subscribe(
        response => {
          if (response.isEmailTaken) {
            this.form.get('email')?.setErrors({ emailTaken: true });
          }
        }
      );

    this.form.get('telefono')?.valueChanges
      .pipe(
        debounceTime(500),
        distinctUntilChanged(),
        switchMap(telefono => this.userService.checkTelefono(telefono))
      )
      .subscribe(
        response => {
          if (response.isTelefonoTaken) {
            this.form.get('telefono')?.setErrors({ telefonoTaken: true });
          }
        }
      );
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

  getErrorMessage(controlName: string): string {
    const control = this.form.get(controlName);
    if (control?.errors && control.touched) {
      if (control.errors['required']) return 'Este campo es requerido';
      
      switch (controlName) {
        case 'nombre':
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

  ngOnInit() {
    this.cargarProductos();
  }

  cargarProductos() {
    this.productosService.getProductos().subscribe(
      (productos) => {
        this.productos = productos;
      },
      (error) => {
        console.error('Error al cargar productos:', error);
      }
    );
  }

  nextProduct() {
    if (this.currentIndex < this.productos.length - 1 && !this.isAnimating) {
      this.isAnimating = true;
      this.nextIndex = this.currentIndex + 1;
      
      this.slideDirection = '';
      this.nextImageReady = false;
      
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          this.slideDirection = 'slide-left';
          this.nextImageReady = true;
          
          setTimeout(() => {
            this.currentIndex = this.nextIndex;
            this.slideDirection = '';
            this.nextImageReady = false;
            this.isAnimating = false;
          }, 800);
        });
      });
    }
  }

  prevProduct() {
    if (this.currentIndex > 0 && !this.isAnimating) {
      this.isAnimating = true;
      this.nextIndex = this.currentIndex - 1;
      
      this.slideDirection = '';
      this.nextImageReady = false;
      
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          this.slideDirection = 'slide-right';
          this.nextImageReady = true;
          
          setTimeout(() => {
            this.currentIndex = this.nextIndex;
            this.slideDirection = '';
            this.nextImageReady = false;
            this.isAnimating = false;
          }, 800);
        });
      });
    }
  }

  onSubmit() {
    if (this.form.valid) {
      const formData = this.form.value;
      const userData: Omit<Usuario, 'id'> = {
        name: formData.nombre,
        email: formData.email,
        telefono: formData.telefono,
        password: formData.password,
        direccion: formData.direccion,
        role: 'user'
      };
  
      console.log('Datos a enviar:', userData);
  
      this.userService.registrarUsuario(userData).subscribe({
        next: (response) => {
          Swal.fire({
            title: '¡Éxito!',
            text: 'Usuario registrado correctamente.',
            icon: 'success',
            confirmButtonText: 'Aceptar'
          }).then(() => {
            this.router.navigate(['/login']);
          });
        },
        error: (error) => {
          Swal.fire({
            title: '¡Error!',
            text: 'No se pudo registrar el usuario. Por favor, inténtalo de nuevo.',
            icon: 'error',
            confirmButtonText: 'Cerrar'
          });
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
}
