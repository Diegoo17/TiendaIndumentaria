import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors, FormBuilder } from '@angular/forms';
import { UsuariosService } from '../../services/usuarioService/usuarios.service';
import { Router } from '@angular/router';
import { map } from 'rxjs';
import { Usuario } from '../../interface/usuario';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-agregar-usuario',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './agregar-admin.component.html',
  styleUrl: './agregar-admin.component.css'
})


export class AgregarAdminComponent implements OnInit {
  form: FormGroup;

  constructor(
    private userService: UsuariosService,
    private router: Router,
    private fb: FormBuilder
  ) {
    this.form = this.fb.group({
      email: new FormControl('', [
        Validators.required,
        Validators.email,
        this.validDomain
      ], [this.emailValidator()]),
      password: new FormControl('', [
        Validators.required,
        Validators.minLength(8),
        Validators.pattern(/[A-Z]/),
        Validators.pattern(/[0-9]/),
        Validators.pattern(/[!@#$%^&*(),.?":{}|<>]/)
      ]),
    });
  }
  ngOnInit(): void {}

  validDomain(control: FormControl): { [key: string]: boolean } | null {
    const email = control.value;
    if (email && email.includes('@')) {
      const domain = email.split('@')[1];
      if (!['gmail.com', 'hotmail.com'].includes(domain)) {
        return { invalidDomain: true };
      }
    }
    return null;
  }
  onSubmit() {
    if (this.form.valid) {
          const formData = this.form.value;
          const userData: Omit<Usuario, 'id'> = {
            name: '',
            email: formData.email,
            telefono: '',
            password: formData.password,
            direccion: '',
            role: 'admin'
          };
          
          console.log('Datos a enviar:', userData);
      
          this.userService.registrarAdmin(userData).subscribe({
            next: (response) => {
              Swal.fire({
                title: '¡Éxito!',
                text: 'Admin registrado correctamente',
                icon: 'success',
                confirmButtonText: 'Aceptar'
              });
            },
            error: (error) => {
              console.error('Error detallado:', error.error);
            }
          });
        }
     
  }
  


  emailValidator() {
    return (control: AbstractControl) => {
      return this.userService.checkEmail(control.value).pipe(
        map(response => {
          return response.isEmailTaken ? { emailTaken: true } : null;
        })
      );
    };
  }
  

}
