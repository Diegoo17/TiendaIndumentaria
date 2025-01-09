import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UsuariosService } from '../../services/usuarioService/usuarios.service';
import { Usuario } from '../../interface/usuario';
import Swal from 'sweetalert2';

@Component({
    selector: 'app-lista-usuarios',
    imports: [CommonModule],
    templateUrl: './lista-usuarios.component.html',
    styleUrls: ['./lista-usuarios.component.css']
})
export class ListaUsuariosComponent implements OnInit {
  usuarios: Usuario[] = [];

  constructor(private usuariosService: UsuariosService) {}

  ngOnInit() {
    this.cargarUsuarios();
  }

  cargarUsuarios() {
    this.usuariosService.getUsuarios().subscribe({
      next: (response: any) => {
        if (response.success && response.usuarios) {
          this.usuarios = response.usuarios;
        } else {
          console.error('Formato de respuesta inesperado:', response);
        }
      },
      error: (error) => {
        console.error('Error detallado:', error);
      }
    });
  }

  eliminarUsuario(id: number | undefined) {
    if (id) {
      Swal.fire({
        title: '¿Estás seguro?',
        text: 'Una vez eliminado, no podrás recuperar este usuario.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
      }).then((result) => {
        if (result.isConfirmed) {
          this.usuariosService.eliminarUsuario(id).subscribe({
            next: () => {
              this.cargarUsuarios();
            },
            error: (error) => {
              console.error('Error al eliminar usuario:', error);
            }
          });
        }
      });
    }
  }
  
}
